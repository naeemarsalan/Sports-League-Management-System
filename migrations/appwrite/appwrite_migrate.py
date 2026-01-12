#!/usr/bin/env python3
import argparse
import csv
import os
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import requests

COPY_PATTERN = re.compile(r"^COPY public\.(\w+)\s+\(([^)]+)\) FROM stdin;")

INT_FIELDS = {
    "users": {"id"},
    "players": {"id", "user_id"},
    "matches": {"id", "player1_id", "player2_id", "score_player1", "score_player2"},
}
BOOL_FIELDS = {"matches": {"is_completed"}}
DATE_FIELDS = {"matches": {"week_commencing"}}
DATETIME_FIELDS = {"matches": {"scheduled_at"}}


class AppwriteClient:
    def __init__(
        self, endpoint: str, project_id: str, api_key: str, dry_run: bool = False
    ) -> None:
        self.endpoint = endpoint.rstrip("/")
        self.project_id = project_id
        self.api_key = api_key
        self.dry_run = dry_run

    def _url(self, path: str) -> str:
        base = self.endpoint
        if base.endswith("/v1"):
            return f"{base}{path}"
        return f"{base}/v1{path}"

    def request(
        self, method: str, path: str, payload: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if self.dry_run:
            return {"$id": f"dry-{hash(path) & 0xFFFF}"}

        response = requests.request(
            method,
            self._url(path),
            headers={
                "X-Appwrite-Project": self.project_id,
                "X-Appwrite-Key": self.api_key,
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=30,
        )
        response.raise_for_status()
        if response.content:
            return response.json()
        return {}

    def create_user(self, email: str, password: str, name: str) -> str:
        payload = {
            "userId": "unique()",
            "email": email,
            "password": password,
            "name": name,
        }
        result = self.request("POST", "/users", payload)
        return result["$id"]

    def create_document(
        self,
        database_id: str,
        collection_id: str,
        data: Dict[str, Any],
        permissions: Optional[List[str]] = None,
    ) -> str:
        payload = {
            "documentId": "unique()",
            "data": data,
        }
        if permissions:
            payload["permissions"] = permissions
        result = self.request(
            "POST",
            f"/databases/{database_id}/collections/{collection_id}/documents",
            payload,
        )
        return result["$id"]


def parse_copy_blocks(path: str) -> Dict[str, List[Dict[str, Any]]]:
    data: Dict[str, List[Dict[str, Any]]] = {}
    with open(path, "r", encoding="utf-8") as file:
        while True:
            line = file.readline()
            if not line:
                break
            line = line.rstrip("\n")
            match = COPY_PATTERN.match(line)
            if not match:
                continue

            table = match.group(1)
            columns = [col.strip() for col in match.group(2).split(",")]
            rows: List[Dict[str, Any]] = []

            while True:
                row_line = file.readline()
                if not row_line:
                    break
                row_line = row_line.rstrip("\n")
                if row_line.strip() == r"\\.":
                    break

                parsed = next(csv.reader([row_line], delimiter="\t"))
                if len(parsed) != len(columns):
                    break
                if any(value.strip() == r"\\." for value in parsed):
                    break
                row: Dict[str, Any] = {}
                for col, value in zip(columns, parsed):
                    row[col] = normalize_value(table, col, value)
                rows.append(row)

            data[table] = rows

    return data


def normalize_value(table: str, column: str, value: str) -> Any:
    cleaned = value.strip()
    if cleaned in {r"\\N", r"\N", "NULL", ""}:
        return None
    if table in INT_FIELDS and column in INT_FIELDS[table]:
        return int(cleaned)
    if table in BOOL_FIELDS and column in BOOL_FIELDS[table]:
        return cleaned.lower() in {"t", "true", "1"}
    if table in DATE_FIELDS and column in DATE_FIELDS[table]:
        return datetime.strptime(cleaned, "%Y-%m-%d").date().isoformat()
    if table in DATETIME_FIELDS and column in DATETIME_FIELDS[table]:
        return datetime.strptime(cleaned, "%Y-%m-%d %H:%M:%S").isoformat()
    return cleaned


def normalize_email(username: str) -> str:
    cleaned = username.strip().lower()
    if "@" in cleaned:
        return cleaned
    return f"{cleaned}@legacy.local"


def compact_dict(payload: Dict[str, Any]) -> Dict[str, Any]:
    return {key: value for key, value in payload.items() if value is not None}


def build_permissions(
    member_role: str, admin_role: Optional[str], user_ids: List[str]
) -> List[str]:
    permissions = [f'read("{member_role}")']
    permissions.extend([f'write("user:{user_id}")' for user_id in user_ids])
    if admin_role:
        permissions.append(f'write("{admin_role}")')
    return permissions


def migrate(
    dump_path: str,
    client: AppwriteClient,
    database_id: str,
    profiles_id: str,
    matches_id: str,
) -> None:
    data = parse_copy_blocks(dump_path)
    users = sorted(data.get("users", []), key=lambda row: row["id"])
    players = data.get("players", [])
    matches = sorted(data.get("matches", []), key=lambda row: row["id"])

    players_by_user = {player["user_id"]: player for player in players}

    default_password = os.environ.get("DEFAULT_PASSWORD", "ChangeMe123!")
    member_role = os.environ.get("APPWRITE_MEMBER_ROLE", "users")
    admin_role = os.environ.get("APPWRITE_ADMIN_ROLE")

    user_map: Dict[int, str] = {}
    player_map: Dict[int, Tuple[str, str]] = {}

    print(f"Creating {len(users)} users...")
    for user in users:
        email = normalize_email(user["username"])
        name = user["username"]
        user_id = client.create_user(email, default_password, name)
        user_map[user["id"]] = user_id

        player = players_by_user.get(user["id"])
        display_name = player["name"] if player else user["username"]
        profile_payload = compact_dict(
            {
                "userId": user_id,
                "displayName": display_name,
                "role": user["role"],
                "legacyUserId": user["id"],
                "legacyPlayerId": player["id"] if player else None,
            }
        )
        profile_permissions = build_permissions(member_role, admin_role, [user_id])
        profile_id = client.create_document(
            database_id, profiles_id, profile_payload, profile_permissions
        )

        if player:
            player_map[player["id"]] = (profile_id, user_id)

    print(f"Creating {len(matches)} matches...")
    missing_players = 0
    for match in matches:
        player1 = player_map.get(match["player1_id"])
        player2 = player_map.get(match["player2_id"])
        if not player1 or not player2:
            missing_players += 1
            continue

        match_payload = compact_dict(
            {
                "player1Id": player1[0],
                "player2Id": player2[0],
                "weekCommencing": match["week_commencing"],
                "scheduledAt": match["scheduled_at"],
                "scorePlayer1": match["score_player1"],
                "scorePlayer2": match["score_player2"],
                "isCompleted": match["is_completed"],
            }
        )
        match_permissions = build_permissions(
            member_role, admin_role, [player1[1], player2[1]]
        )
        client.create_document(
            database_id, matches_id, match_payload, match_permissions
        )

    if missing_players:
        print(f"Skipped {missing_players} matches due to missing players.")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Migrate pool league SQL dump into Appwrite."
    )
    parser.add_argument(
        "--dump",
        default="data/pool_league_backup.sql",
        help="Path to the SQL dump file.",
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="Parse data without API calls."
    )
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    endpoint = os.environ.get("APPWRITE_ENDPOINT")
    project_id = os.environ.get("APPWRITE_PROJECT_ID")
    api_key = os.environ.get("APPWRITE_API_KEY")
    database_id = os.environ.get("APPWRITE_DATABASE_ID")
    profiles_id = os.environ.get("APPWRITE_PROFILES_COLLECTION_ID")
    matches_id = os.environ.get("APPWRITE_MATCHES_COLLECTION_ID")

    if not args.dry_run:
        missing = [
            name
            for name, value in [
                ("APPWRITE_ENDPOINT", endpoint),
                ("APPWRITE_PROJECT_ID", project_id),
                ("APPWRITE_API_KEY", api_key),
                ("APPWRITE_DATABASE_ID", database_id),
                ("APPWRITE_PROFILES_COLLECTION_ID", profiles_id),
                ("APPWRITE_MATCHES_COLLECTION_ID", matches_id),
            ]
            if not value
        ]
        if missing:
            raise SystemExit(f"Missing required env vars: {', '.join(missing)}")

    client = AppwriteClient(
        endpoint or "http://localhost",
        project_id or "project",
        api_key or "key",
        dry_run=args.dry_run,
    )

    migrate(
        args.dump,
        client,
        database_id or "database",
        profiles_id or "profiles",
        matches_id or "matches",
    )


if __name__ == "__main__":
    main()

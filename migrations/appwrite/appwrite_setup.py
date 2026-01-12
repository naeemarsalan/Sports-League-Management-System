#!/usr/bin/env python3
import argparse
import os
import time
from typing import Any, Dict, Optional

import requests


class AppwriteAdmin:
    def __init__(self, endpoint: str, project_id: str, api_key: str) -> None:
        self.endpoint = endpoint.rstrip("/")
        self.project_id = project_id
        self.api_key = api_key

    def _url(self, path: str) -> str:
        base = self.endpoint
        if base.endswith("/v1"):
            return f"{base}{path}"
        return f"{base}/v1{path}"

    def request(
        self, method: str, path: str, payload: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
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
        if response.status_code == 409:
            if payload:
                return {
                    "$id": payload.get("collectionId")
                    or payload.get("databaseId")
                    or payload.get("key")
                    or "exists"
                }
            return {"$id": "exists"}
        if response.status_code >= 400:
            raise SystemExit(
                f"Appwrite error {response.status_code} for {path}: {response.text}"
            )
        if response.content:
            return response.json()
        return {}

    def create_database(self, database_id: str, name: str) -> str:
        payload = {"databaseId": database_id, "name": name}
        result = self.request("POST", "/databases", payload)
        return result.get("$id", database_id)

    def create_collection(
        self, database_id: str, collection_id: str, name: str, permissions: list
    ) -> str:
        payload = {
            "collectionId": collection_id,
            "name": name,
            "permissions": permissions,
            "documentSecurity": True,
        }
        result = self.request("POST", f"/databases/{database_id}/collections", payload)
        return result.get("$id", collection_id)

    def create_attribute(
        self, database_id: str, collection_id: str, path: str, payload: Dict[str, Any]
    ) -> None:
        self.request(
            "POST",
            f"/databases/{database_id}/collections/{collection_id}/attributes/{path}",
            payload,
        )

    def create_index(
        self,
        database_id: str,
        collection_id: str,
        key: str,
        index_type: str,
        attributes: list,
    ) -> None:
        payload = {
            "key": key,
            "type": index_type,
            "attributes": attributes,
        }
        self.request(
            "POST",
            f"/databases/{database_id}/collections/{collection_id}/indexes",
            payload,
        )


def build_permissions(member_role: str, admin_role: Optional[str]) -> list:
    permissions = [f'read("{member_role}")']
    if admin_role:
        permissions.append(f'write("{admin_role}")')
    return permissions


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Create Appwrite database and collections for the league app."
    )
    parser.add_argument("--database-id", default="pool-league")
    parser.add_argument("--database-name", default="Pool League")
    parser.add_argument("--profiles-id", default="profiles")
    parser.add_argument("--matches-id", default="matches")
    args = parser.parse_args()

    endpoint = os.environ.get("APPWRITE_ENDPOINT")
    project_id = os.environ.get("APPWRITE_PROJECT_ID")
    api_key = os.environ.get("APPWRITE_API_KEY")
    if not endpoint or not project_id or not api_key:
        raise SystemExit(
            "Missing APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, or APPWRITE_API_KEY"
        )

    member_role = os.environ.get("APPWRITE_MEMBER_ROLE", "users")
    admin_role = os.environ.get("APPWRITE_ADMIN_ROLE")
    admin = AppwriteAdmin(endpoint, project_id, api_key)

    database_id = admin.create_database(args.database_id, args.database_name)
    permissions = build_permissions(member_role, admin_role)

    profiles_id = admin.create_collection(
        database_id, args.profiles_id, "Profiles", permissions
    )
    matches_id = admin.create_collection(
        database_id, args.matches_id, "Matches", permissions
    )

    admin.create_attribute(
        database_id,
        profiles_id,
        "string",
        {
            "key": "userId",
            "size": 255,
            "required": True,
            "array": False,
        },
    )
    admin.create_attribute(
        database_id,
        profiles_id,
        "string",
        {
            "key": "displayName",
            "size": 255,
            "required": True,
            "array": False,
        },
    )
    admin.create_attribute(
        database_id,
        profiles_id,
        "string",
        {
            "key": "role",
            "size": 50,
            "required": True,
            "array": False,
        },
    )
    admin.create_attribute(
        database_id,
        profiles_id,
        "integer",
        {
            "key": "legacyUserId",
            "required": False,
            "min": None,
            "max": None,
            "array": False,
        },
    )
    admin.create_attribute(
        database_id,
        profiles_id,
        "integer",
        {
            "key": "legacyPlayerId",
            "required": False,
            "min": None,
            "max": None,
            "array": False,
        },
    )

    admin.create_attribute(
        database_id,
        matches_id,
        "string",
        {
            "key": "player1Id",
            "size": 255,
            "required": True,
            "array": False,
        },
    )
    admin.create_attribute(
        database_id,
        matches_id,
        "string",
        {
            "key": "player2Id",
            "size": 255,
            "required": True,
            "array": False,
        },
    )
    admin.create_attribute(
        database_id,
        matches_id,
        "datetime",
        {
            "key": "weekCommencing",
            "required": True,
            "array": False,
        },
    )
    admin.create_attribute(
        database_id,
        matches_id,
        "datetime",
        {
            "key": "scheduledAt",
            "required": False,
            "array": False,
        },
    )
    admin.create_attribute(
        database_id,
        matches_id,
        "integer",
        {
            "key": "scorePlayer1",
            "required": False,
            "min": None,
            "max": None,
            "array": False,
        },
    )
    admin.create_attribute(
        database_id,
        matches_id,
        "integer",
        {
            "key": "scorePlayer2",
            "required": False,
            "min": None,
            "max": None,
            "array": False,
        },
    )
    admin.create_attribute(
        database_id,
        matches_id,
        "boolean",
        {
            "key": "isCompleted",
            "required": False,
            "default": False,
            "array": False,
        },
    )

    time.sleep(2)
    admin.create_index(
        database_id, matches_id, "matches_week", "key", ["weekCommencing"]
    )
    admin.create_index(database_id, matches_id, "matches_player1", "key", ["player1Id"])
    admin.create_index(database_id, matches_id, "matches_player2", "key", ["player2Id"])
    admin.create_index(
        database_id, matches_id, "matches_completed", "key", ["isCompleted"]
    )
    admin.create_index(
        database_id, profiles_id, "profiles_name", "key", ["displayName"]
    )

    print("Appwrite database and collections are ready.")


if __name__ == "__main__":
    main()

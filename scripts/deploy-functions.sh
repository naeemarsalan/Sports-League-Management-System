#!/usr/bin/env bash
#
# Deploy Appwrite cloud functions for push notifications.
#
# Required env vars:
#   APPWRITE_ENDPOINT    – e.g. https://appwrite.arsalan.io/v1
#   APPWRITE_PROJECT_ID  – project ID (default: from appwrite.config.json)
#   APPWRITE_API_KEY     – API key with functions.read, functions.write, users.read, users.write scopes
#   PUSH_PROVIDER_ID     – (optional) messaging provider ID for push targets
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FUNCTIONS_DIR="$PROJECT_ROOT/appwrite/functions"

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------
: "${APPWRITE_ENDPOINT:=https://appwrite.arsalan.io/v1}"
: "${APPWRITE_PROJECT_ID:=696436a5002d6f83aed7}"
: "${APPWRITE_DATABASE_ID:=pool-league}"
: "${PUSH_PROVIDER_ID:=expo-push}"
: "${NODE_RUNTIME:=node-18.0}"

# Collection IDs for delete-account
: "${APPWRITE_PROFILES_COLLECTION_ID:=profiles}"
: "${APPWRITE_LEAGUE_MEMBERS_COLLECTION_ID:=league_members}"
: "${APPWRITE_LEAGUES_COLLECTION_ID:=leagues}"

if [ -z "${APPWRITE_API_KEY:-}" ]; then
  echo "ERROR: APPWRITE_API_KEY is required."
  exit 1
fi

ENDPOINT="${APPWRITE_ENDPOINT%/}"  # strip trailing slash

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
api() {
  local method="$1" path="$2"
  shift 2
  curl -sS -X "$method" \
    -H "X-Appwrite-Project: $APPWRITE_PROJECT_ID" \
    -H "X-Appwrite-Key: $APPWRITE_API_KEY" \
    "$@" \
    "${ENDPOINT}${path}"
}

api_json() {
  local method="$1" path="$2" payload="$3"
  api "$method" "$path" \
    -H "Content-Type: application/json" \
    -d "$payload"
}

# ---------------------------------------------------------------------------
# Step 0 – Create a push messaging provider (idempotent)
# ---------------------------------------------------------------------------
echo "==> Ensuring push messaging provider '${PUSH_PROVIDER_ID}' exists …"
PROVIDER_RES=$(api_json POST "/messaging/providers/fcm" \
  "{\"providerId\":\"${PUSH_PROVIDER_ID}\",\"name\":\"Expo Push\",\"enabled\":false}" 2>&1 || true)

if echo "$PROVIDER_RES" | grep -q '"code":409'; then
  echo "    Provider already exists."
elif echo "$PROVIDER_RES" | grep -q '"\$id"'; then
  echo "    Provider created."
else
  echo "    Warning: could not create provider (may need manual setup): $PROVIDER_RES"
fi

# ---------------------------------------------------------------------------
# Deploy a single function
# ---------------------------------------------------------------------------
deploy_function() {
  local func_id="$1"
  local func_dir="$FUNCTIONS_DIR/$func_id"

  echo ""
  echo "==> Deploying function: $func_id"

  if [ ! -d "$func_dir" ]; then
    echo "ERROR: Function directory not found: $func_dir"
    return 1
  fi

  # 1. Install dependencies
  echo "    Installing npm dependencies …"
  (cd "$func_dir" && npm install --production --silent 2>&1)

  # 2. Create tarball
  echo "    Creating tarball …"
  local tarball="/tmp/${func_id}.tar.gz"
  tar -czf "$tarball" -C "$func_dir" .

  # 3. Create function (handle 409 = already exists)
  echo "    Creating function definition …"
  local CREATE_RES
  CREATE_RES=$(api_json POST "/functions" \
    "{\"functionId\":\"${func_id}\",\"name\":\"${func_id}\",\"runtime\":\"${NODE_RUNTIME}\",\"entrypoint\":\"index.js\",\"execute\":[\"users\"]}" 2>&1 || true)

  if echo "$CREATE_RES" | grep -q '"code":409'; then
    echo "    Function already exists, updating …"
    api_json PUT "/functions/${func_id}" \
      "{\"name\":\"${func_id}\",\"runtime\":\"${NODE_RUNTIME}\",\"entrypoint\":\"index.js\",\"execute\":[\"users\"]}" > /dev/null 2>&1 || true
  elif echo "$CREATE_RES" | grep -q '"\$id"'; then
    echo "    Function created."
  else
    echo "    Warning: unexpected response: $CREATE_RES"
  fi

  # 4. Set environment variables
  echo "    Setting environment variables …"

  # Determine which env vars this function needs
  local env_keys
  case "$func_id" in
    league-api)
      env_keys="APPWRITE_ENDPOINT APPWRITE_PROJECT_ID APPWRITE_API_KEY APPWRITE_DATABASE_ID"
      ;;
    delete-account)
      env_keys="APPWRITE_ENDPOINT APPWRITE_PROJECT_ID APPWRITE_API_KEY APPWRITE_DATABASE_ID APPWRITE_PROFILES_COLLECTION_ID APPWRITE_LEAGUE_MEMBERS_COLLECTION_ID APPWRITE_LEAGUES_COLLECTION_ID"
      ;;
    *)
      env_keys="APPWRITE_ENDPOINT APPWRITE_PROJECT_ID APPWRITE_API_KEY PUSH_PROVIDER_ID"
      ;;
  esac

  # Set variables one at a time (Appwrite API)
  for key in $env_keys; do
    local val
    case "$key" in
      APPWRITE_ENDPOINT)                   val="$ENDPOINT" ;;
      APPWRITE_PROJECT_ID)                 val="$APPWRITE_PROJECT_ID" ;;
      APPWRITE_API_KEY)                    val="$APPWRITE_API_KEY" ;;
      APPWRITE_DATABASE_ID)                val="$APPWRITE_DATABASE_ID" ;;
      PUSH_PROVIDER_ID)                    val="$PUSH_PROVIDER_ID" ;;
      APPWRITE_PROFILES_COLLECTION_ID)     val="$APPWRITE_PROFILES_COLLECTION_ID" ;;
      APPWRITE_LEAGUE_MEMBERS_COLLECTION_ID) val="$APPWRITE_LEAGUE_MEMBERS_COLLECTION_ID" ;;
      APPWRITE_LEAGUES_COLLECTION_ID)      val="$APPWRITE_LEAGUES_COLLECTION_ID" ;;
    esac

    # Try to create; if 409, update
    local VAR_RES
    VAR_RES=$(api_json POST "/functions/${func_id}/variables" \
      "{\"key\":\"${key}\",\"value\":\"${val}\"}" 2>&1 || true)

    if echo "$VAR_RES" | grep -q '"code":409'; then
      # Get existing variable ID and update it
      local VAR_ID
      VAR_ID=$(api GET "/functions/${func_id}/variables" \
        -H "Content-Type: application/json" 2>/dev/null \
        | python3 -c "import sys,json; vs=json.load(sys.stdin).get('variables',[]); print(next((v['\$id'] for v in vs if v['key']=='${key}'),''))" 2>/dev/null || echo "")
      if [ -n "$VAR_ID" ]; then
        api_json PUT "/functions/${func_id}/variables/${VAR_ID}" \
          "{\"key\":\"${key}\",\"value\":\"${val}\"}" > /dev/null 2>&1 || true
      fi
    fi
  done

  # 5. Upload deployment
  echo "    Uploading deployment …"
  local DEPLOY_RES
  DEPLOY_RES=$(api POST "/functions/${func_id}/deployments" \
    -H "Content-Type: multipart/form-data" \
    -F "code=@${tarball}" \
    -F "activate=true" \
    -F "entrypoint=index.js" 2>&1)

  if echo "$DEPLOY_RES" | grep -q '"\$id"'; then
    local DEPLOY_ID
    DEPLOY_ID=$(echo "$DEPLOY_RES" | python3 -c "import sys,json; print(json.load(sys.stdin).get('\$id','unknown'))" 2>/dev/null || echo "unknown")
    echo "    Deployment created: $DEPLOY_ID"
  else
    echo "    Warning: deployment response: $DEPLOY_RES"
  fi

  # Cleanup
  rm -f "$tarball"
  echo "    Done."
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
deploy_function "save-push-token"
deploy_function "send-push"
deploy_function "league-api"
deploy_function "delete-account"

echo ""
echo "==> All functions deployed successfully!"
echo "    Verify in Appwrite Console > Functions"

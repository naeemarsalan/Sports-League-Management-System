---
description: Deploy Appwrite cloud functions (league-api, send-push, save-push-token, delete-account)
---

Deploy Appwrite functions using the deploy script. API key is stored in the APPWRITE_API_KEY environment variable.

Steps:
1. Check which functions have been modified since last deployment by reviewing recent git changes in `appwrite/functions/`
2. Run `scripts/deploy-functions.sh` with required env vars
3. Verify deployment by checking function status via Appwrite API
4. Report which functions were deployed and their deployment IDs

Environment variables needed:
- `APPWRITE_API_KEY` - must be set (check .mcp.json for reference)
- `APPWRITE_ENDPOINT` - defaults to https://appwrite.arsalan.io/v1
- `APPWRITE_PROJECT_ID` - defaults to 696436a5002d6f83aed7

Functions available: save-push-token, send-push, league-api, delete-account, leaderboard, migrate-matches

If deploying a single function, use the Appwrite API directly instead of the full script.

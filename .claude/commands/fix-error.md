---
description: Debug and fix a runtime error from mobile app or web template
---

The user will paste an error message or stack trace. Debug and fix it.

Steps:
1. Parse the error message to identify:
   - Which component/module (mobile, web, function)
   - The error type (build error, runtime crash, API error, permission error)
   - The relevant file and line number
2. Read the relevant source files
3. Identify the root cause
4. Apply the fix
5. If it's a mobile error, check if the Appwrite function side also needs changes
6. If it's a permission/auth error, check both:
   - `appwrite/functions/league-api/lib/permissions.js` (RBAC matrix)
   - `appwrite/functions/league-api/lib/auth.js` (auth middleware)
   - Collection permissions in `appwrite.config.json`

Common error patterns in this project:
- "Unknown action: X" -> Missing action handler in league-api/index.js
- "not authorized" -> RBAC role check or missing JWT
- "Invalid query" -> Appwrite SDK query format issue
- "Unable to resolve" -> Missing npm dependency
- Push notification failures -> APNs token format or provider config

$ARGUMENTS - The error message or stack trace to debug

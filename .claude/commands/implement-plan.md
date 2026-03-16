---
description: Implement a user-provided plan step by step
---

The user will provide a detailed implementation plan. Execute it methodically.

Workflow:
1. Parse the plan into discrete steps
2. For each step:
   a. Read the relevant files before making changes
   b. Implement the change
   c. Verify no syntax errors
3. After all steps are complete:
   - Run unit tests if the changes touch Appwrite functions
   - Report what was done

Key project conventions:
- Mobile app: React Native + Expo, Zustand stores, React Navigation
- Backend: Appwrite functions with action-based routing in league-api/index.js
- RBAC roles: player(1), mod(2), admin(3), owner(4) - defined in permissions.js
- Database: Appwrite collections (profiles, leagues, league_members, matches, notification_logs)
- Web: Next.js 15 App Router + Tailwind CSS + Framer Motion

Do NOT deploy functions unless the plan explicitly says to.
Do NOT push code unless asked.

$ARGUMENTS - The implementation plan

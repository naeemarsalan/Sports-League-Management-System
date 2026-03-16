---
description: Review PR comments and create a fix plan
---

Review pull request comments and create an implementation plan to address them.

Steps:
1. Fetch PR details and all review comments using `gh` CLI or GitHub MCP
2. Group comments by file and categorize:
   - Bug fixes (auth, RBAC, race conditions)
   - Code quality (refactoring, naming)
   - Security issues
   - Testing gaps
3. Create a prioritized fix plan with specific file paths and line numbers
4. Present the plan to the user for approval before implementing

If given a PR URL, extract the PR number and repo from it.
If no URL given, check for open PRs on the current branch.

After fixes are implemented:
- Run relevant tests
- Push changes
- Reply to resolved comments if asked

$ARGUMENTS - PR URL or number (e.g., "123" or "https://github.com/org/repo/pull/123")

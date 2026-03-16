---
description: Create a PR from dev to the target branch (default: new)
---

Create a pull request with a well-structured description.

Steps:
1. Check current branch and uncommitted changes
2. Review all commits since diverging from the target branch
3. Run `git diff <target>...HEAD` to understand full changeset
4. Create PR with:
   - Short title (under 70 chars)
   - Summary section with bullet points
   - Test plan section
5. Push branch if needed, then create PR via `gh pr create`

Default flow: `dev` -> `new` (main branch)

If there are uncommitted changes, ask the user if they want to commit first.

$ARGUMENTS - Optional: target branch (defaults to "new")

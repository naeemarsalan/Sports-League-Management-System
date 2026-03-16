---
description: Check CI pipeline status and fix failing jobs
---

Check the status of GitHub Actions workflows and fix any failures.

Steps:
1. List recent workflow runs: `gh run list --limit 5`
2. If any are failing, get details: `gh run view <run-id>`
3. Download logs for failed jobs: `gh run view <run-id> --log-failed`
4. Analyze failures and fix the root cause
5. Push fixes and verify the re-run passes

CI workflows in this project:
- `e2e-tests.yml` - 8 parallel jobs (Detox, Gitleaks, npm audit, Semgrep, Bandit, Trivy, license-checker)
- `build-ios.yml` - iOS build on self-hosted runner
- `security.yml` - Security scanning
- `dependency-review.yml` - Dependency vetting

CI runs on self-hosted runner. Workflows trigger on PRs to `main`/`new`.

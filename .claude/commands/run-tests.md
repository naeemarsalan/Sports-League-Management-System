---
description: Run tests - unit tests for Appwrite functions and/or E2E tests
---

Run the project test suites. The user may specify which tests to run.

## Unit Tests (Appwrite Functions)
```bash
cd appwrite/functions && npx jest --verbose
```
- Leaderboard function has 17+ unit tests
- league-api has tests in `__tests__/` directory

## E2E Smoke Tests
Run the E2E tests against the live Appwrite backend. Tests use real user accounts:
- Primary: test@test.com
- Secondary: test2@test.com

These tests exercise the full flow: auth -> create league -> join league -> challenge -> add matches -> verify leaderboard -> verify notifications.

API keys for E2E tests are in `.mcp.json` (use the APPWRITE_API_KEY).

## Security Tests
If the user asks to run security tests after E2E:
```bash
# Run all security scanning in parallel
npx gitleaks detect --source . --verbose
npm audit --audit-level=moderate
npx semgrep --config .semgreprc.yml
npx license-checker --failOn 'GPL-3.0'
```

## After Tests
- Report pass/fail counts
- If failures occur, analyze the error output and suggest fixes
- Do NOT automatically fix unless asked

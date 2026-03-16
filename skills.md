# Skills & Slash Commands

Custom Claude Code slash commands for the Sports League Management System. These are based on recurring workflows from previous conversations.

## Available Commands

| Command | Description |
|---------|-------------|
| `/implement-plan` | Execute a detailed implementation plan step by step |
| `/deploy-functions` | Deploy Appwrite cloud functions (league-api, send-push, etc.) |
| `/run-tests` | Run unit tests, E2E tests, and/or security scans |
| `/fix-error` | Debug and fix a runtime error from a pasted stack trace |
| `/review-pr` | Review PR comments and create a fix plan |
| `/create-pr` | Create a pull request (default: dev -> new) |
| `/release-ios` | Build iOS IPA and create a GitHub Release |
| `/check-ci` | Check GitHub Actions status and fix failing jobs |
| `/web-dev` | Start Next.js dev server and work on the marketing site |
| `/check-infra` | Check Appwrite, Grafana, and Prometheus health |

## Common Workflows

### 1. Feature Development
```
/implement-plan <paste plan>
/run-tests
/create-pr
```

### 2. PR Review Cycle
```
/review-pr <PR URL>
# implement fixes
/run-tests
# push changes
```

### 3. Deploy After Merge
```
/deploy-functions
/check-infra
```

### 4. Debug Production Issue
```
/fix-error <paste error>
/run-tests
/deploy-functions
```

### 5. iOS Release
```
/release-ios v1.0.0
/check-ci
```

## Project Context

- **Mobile**: React Native + Expo (Zustand, React Navigation, TanStack Query)
- **Backend**: Appwrite serverless functions with action-based routing
- **Web**: Next.js 15 + Tailwind CSS + Framer Motion
- **CI/CD**: GitHub Actions (self-hosted runner), EAS Build
- **Monitoring**: Grafana + Prometheus (K8s metrics)
- **Main branch**: `new` | **Dev branch**: `dev`
- **RBAC roles**: player(1), mod(2), admin(3), owner(4)

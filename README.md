# Snooker & Pool League Management System

A full-stack mobile application for managing snooker and pool leagues — built with React Native (Expo), Appwrite serverless backend, and automated CI/CD pipelines.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Repository Layout](#repository-layout)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Mobile App Setup](#mobile-app-setup)
  - [Appwrite Backend Setup](#appwrite-backend-setup)
  - [Deploying Functions](#deploying-functions)
- [Mobile App](#mobile-app)
  - [Navigation Structure](#navigation-structure)
  - [State Management](#state-management)
  - [Push Notifications](#push-notifications)
- [Backend — Appwrite Functions](#backend--appwrite-functions)
  - [league-api](#league-api)
  - [leaderboard](#leaderboard)
  - [send-push](#send-push)
  - [save-push-token](#save-push-token)
  - [delete-account](#delete-account)
- [Database Schema](#database-schema)
- [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
- [CI/CD Pipelines](#cicd-pipelines)
  - [CI Pipeline](#ci-pipeline)
  - [iOS Release Pipeline](#ios-release-pipeline)
- [Scripts](#scripts)
- [Testing](#testing)
- [Environment Variables](#environment-variables)
- [Infrastructure](#infrastructure)
- [Security](#security)
- [License](#license)

---

## Architecture Overview

```
┌───────────────────────────────────────────────────────────┐
│                    React Native (Expo)                     │
│         iOS app — React Navigation, Zustand, TanStack     │
└──────────────────────────┬────────────────────────────────┘
                           │  Appwrite SDK
                           ▼
┌───────────────────────────────────────────────────────────┐
│                   Appwrite v1.8.1 BaaS                    │
│  ┌─────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │   Auth       │ │ Database │ │Functions │ │Messaging │  │
│  │  (email/pw)  │ │ (NoSQL)  │ │(Node 16) │ │(APNs/FCM)│  │
│  └─────────────┘ └──────────┘ └──────────┘ └──────────┘  │
└───────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────┼────────────────────────────────┐
│  Serverless Functions    │                                │
│  ├── league-api          │  20+ actions (CRUD, RBAC)      │
│  ├── leaderboard         │  Scoring engine & rankings     │
│  ├── send-push           │  Rate-limited notifications    │
│  ├── save-push-token     │  Device token registration     │
│  └── delete-account      │  Cascade account deletion      │
└───────────────────────────────────────────────────────────┘
```

**Key technology choices:**

| Layer | Technology | Version |
|-------|-----------|---------|
| Mobile | React Native + Expo | RN 0.81.5, Expo 54 |
| Navigation | React Navigation | 7.x |
| State | Zustand | 5.x |
| Data fetching | TanStack React Query | 5.x |
| Backend | Appwrite | 1.8.1 |
| Functions runtime | Node.js | 16 |
| CI/CD | GitHub Actions | self-hosted runner |
| Build | EAS Build | CLI 16.28+ |
| Distribution | Diawi | OTA |

---

## Repository Layout

```
├── mobile/                          # React Native Expo app
│   ├── src/
│   │   ├── screens/                 # 13 screen components
│   │   ├── components/              # Reusable UI components
│   │   ├── lib/                     # Business logic libraries
│   │   │   ├── appwrite.js          # Appwrite SDK configuration
│   │   │   ├── notifications.js     # Push notification APIs
│   │   │   ├── leagues.js           # League CRUD operations
│   │   │   ├── matches.js           # Match operations
│   │   │   ├── members.js           # Membership & RBAC
│   │   │   ├── profiles.js          # User profiles
│   │   │   ├── leaderboard.js       # Scoring & rankings
│   │   │   └── navigation.js        # Navigation reference
│   │   ├── state/                   # Zustand stores
│   │   │   ├── useAuthStore.js      # Auth state
│   │   │   ├── useLeagueStore.js    # League & membership state
│   │   │   └── useNotificationStore.js
│   │   ├── navigation/
│   │   │   └── AppNavigator.js      # Tab + stack navigation
│   │   └── theme/                   # Colors & styling
│   ├── tests/detox/                 # E2E tests
│   ├── app.json                     # Expo config
│   ├── eas.json                     # EAS Build profiles
│   └── .detoxrc.js                  # Detox E2E config
│
├── appwrite/functions/              # Serverless functions
│   ├── league-api/                  # Main API (action router)
│   │   ├── index.js
│   │   └── lib/
│   │       ├── auth.js              # Authorization helpers
│   │       ├── db.js                # Database CRUD wrapper
│   │       ├── permissions.js       # RBAC matrix
│   │       └── notify.js            # Notification dispatch
│   ├── leaderboard/                 # Scoring engine
│   │   ├── index.js
│   │   └── __tests__/index.test.js  # 17 unit tests
│   ├── send-push/                   # Push notification sender
│   ├── save-push-token/             # Device token registration
│   ├── delete-account/              # Account cascade deletion
│   └── migrate-matches/             # Data migration utility
│
├── migrations/
│   ├── sql/                         # Legacy PostgreSQL migrations
│   └── appwrite/                    # Appwrite setup & migration scripts
│
├── scripts/
│   ├── deploy-functions.sh          # Deploy functions to Appwrite
│   └── release-ios.sh               # Build IPA & create GitHub Release
│
├── .github/workflows/
│   ├── e2e-tests.yml                # CI pipeline (8 parallel jobs)
│   ├── release.yml                  # iOS release → Diawi upload
│   └── security.yml                 # Security scanning
│
├── data/
│   └── pool_league_backup.sql       # Legacy SQL dump for migration
│
├── .gitleaks.toml                   # Secret scanning rules
├── .semgreprc.yml                   # Custom SAST rules
├── .eslintrc.security.json          # ESLint security plugin
├── .pre-commit-config.yaml          # Pre-commit hooks
├── appwrite.json                    # Appwrite project export
├── SECURITY.md                      # Security policy
└── LICENSE                          # MIT
```

---

## Getting Started

### Prerequisites

- **Node.js** 20+
- **Expo CLI** (`npm install -g expo-cli`)
- **EAS CLI** (`npm install -g eas-cli`) — for building IPAs
- **Xcode** 15+ with CocoaPods — for iOS builds
- **gh CLI** (`brew install gh`) — for releases
- **Appwrite instance** — self-hosted or cloud (v1.8.x)
- **Python 3** — for migration scripts

### Mobile App Setup

```bash
# Clone the repository
git clone https://github.com/<owner>/Sports-League-Management-System.git
cd Sports-League-Management-System/mobile

# Install dependencies
npm ci --legacy-peer-deps

# Start the Expo dev server
npx expo start
```

The app connects to the Appwrite backend configured in `mobile/src/lib/appwrite.js`. Update the endpoint and project ID if using your own Appwrite instance.

### Appwrite Backend Setup

1. **Create the database and collections:**

```bash
export APPWRITE_ENDPOINT=https://your-appwrite.example.com/v1
export APPWRITE_PROJECT_ID=your-project-id
export APPWRITE_API_KEY=your-api-key

python migrations/appwrite/appwrite_setup.py \
  --database-id pool-league \
  --database-name "Pool League"
```

2. **(Optional) Migrate data from legacy SQL dump:**

```bash
export APPWRITE_DATABASE_ID=pool-league
export APPWRITE_PROFILES_COLLECTION_ID=profiles
export APPWRITE_MATCHES_COLLECTION_ID=matches

python migrations/appwrite/appwrite_migrate.py \
  --dump data/pool_league_backup.sql
```

### Deploying Functions

```bash
export APPWRITE_API_KEY=your-api-key

./scripts/deploy-functions.sh
```

This deploys `save-push-token` and `send-push` to your Appwrite instance. The script is idempotent — it creates functions if they don't exist, updates them if they do.

---

## Mobile App

### Navigation Structure

```
AppNavigator (root)
├── Not authenticated → Login Stack
│   ├── Login (email + password)
│   └── Register (email + password + display name)
│
├── Authenticated, no profile → ProfileSetup
│   └── ProfileSetup (display name, avatar URL)
│
└── Authenticated, has profile → Main Stack
    ├── Bottom Tabs
    │   ├── Dashboard        — league cards, quick actions, admin controls
    │   ├── Matches          — match list with filters
    │   ├── Leaderboard      — computed standings table
    │   └── Profile          — user settings, leagues, account
    │
    └── Modal Screens
        ├── MatchDetail      — match info + score entry
        ├── Challenge        — create a new match
        ├── Leagues          — browse all leagues
        ├── CreateLeague     — league creation form
        ├── JoinLeague       — join via invite code
        ├── LeagueMembers    — member list + pending requests
        ├── LeagueSettings   — league configuration
        ├── NewMatch         — create match (mod+)
        └── AdminBroadcast   — send push notification to league
```

### State Management

The app uses three Zustand stores:

**useAuthStore** — Authentication and user profile:
- `user` — Appwrite Account object
- `profile` — Profile document from the database
- `bootstrap()` — check session on app launch
- `login(email, password)` / `register(email, password, name)` / `logout()`
- `deleteAccount()` — cascade delete via the delete-account function

**useLeagueStore** — League data and membership:
- `currentLeague` / `currentMembership` — active league context
- `userLeagues[]` / `allLeagues[]` — league lists
- `canPerform(action)` — client-side RBAC check based on membership role
- `fetchUserLeagues()` / `fetchAllLeagues()` / `setCurrentLeague(id)`

**useNotificationStore** — In-app notification history:
- `notifications[]` — received notifications
- `addNotification(notification)` / `clearAll()`

### Push Notifications

**Registration flow:**
1. App launches → `registerForPushNotifications()` requests OS permissions
2. Gets native device token (APNs for iOS, FCM for Android)
3. Calls `save-push-token` function to register the token with Appwrite

**Sending flow:**
1. A backend action triggers `send-push` asynchronously
2. Function resolves the target user's registered device tokens
3. Checks rate limit (50/day per league, configurable)
4. Sends via Appwrite Messaging API

**Receiving:**
- **Foreground:** listener displays an in-app notification modal
- **Background:** OS displays system notification
- **Tap:** navigates to the relevant screen (e.g., MatchDetail)

**Notification types:**
| Type | Trigger |
|------|---------|
| `challenge_received` | Player challenged to a match |
| `match_scheduled` | Match time confirmed |
| `score_submitted` | Match results recorded |
| `join_request` | Someone requests to join your league |
| `join_approved` / `join_rejected` | Membership decision |
| `position_overtaken` | Leaderboard ranking change |
| `admin_broadcast` | Admin announcement to league |

---

## Backend — Appwrite Functions

All functions run on the **Node.js 16** runtime and are deployed to Appwrite as serverless functions.

### league-api

The main business logic function, handling 20+ actions via a single endpoint. The request body contains an `action` field that routes to the appropriate handler.

**League management:**
| Action | Description | Min role |
|--------|-------------|----------|
| `createLeague` | Create league + owner membership | any user |
| `updateLeague` | Update name, description, scoring settings | admin |
| `deleteLeague` | Soft-delete (set `isActive=false`) | owner |
| `regenerateInviteCode` | Generate new 6-char invite code | admin |

**Member management:**
| Action | Description | Min role |
|--------|-------------|----------|
| `requestToJoinLeague` | Submit pending join request | any user |
| `approveMember` | Approve a pending join request | admin |
| `rejectMember` | Reject a pending join request | admin |
| `removeMember` | Remove a member from the league | admin |
| `leaveLeague` | Leave the league voluntarily | player (non-owner) |
| `updateMemberRole` | Change a member's role | admin/owner |
| `transferOwnership` | Transfer ownership to another member | owner |

**Match management:**
| Action | Description | Min role |
|--------|-------------|----------|
| `createMatch` | Create a match between two approved members | mod |
| `updateMatch` | Update scores, status, with optional notification | mod |
| `deleteMatch` | Delete a match | mod |

**Profile:**
| Action | Description | Min role |
|--------|-------------|----------|
| `updateProfile` | Update display name, avatar, bio | own profile |

### leaderboard

Computes league standings by fetching all completed matches and calculating:
- Wins, losses, draws
- Points (configurable: `pointsPerWin`, `pointsPerDraw`, `pointsPerLoss`)
- Frame points (optional bonus based on individual frame wins)
- Sorting: points DESC → wins DESC → name ASC

The function respects per-league scoring configuration. It has 17 unit tests covering edge cases like draws, frame points, custom scoring, null scores, and incomplete matches.

### send-push

Dispatches push notifications with:
- Profile doc ID → auth user ID resolution
- Device target lookup via Appwrite API
- Per-league daily rate limiting (default 50, configurable via `notificationDailyLimit` on the league document)
- Input sanitization (strips HTML tags, limits string length to 200 chars)
- Async execution (non-blocking)

### save-push-token

Registers device push tokens (APNs/FCM) as Appwrite user targets:
- Verifies the caller owns the `userId` (via `x-appwrite-user-id` header)
- Idempotent — checks for existing token before creating
- Target ID format: `target_${timestamp}_${random}`

### delete-account

Cascade account deletion:
1. Delete the user's profile document
2. Delete all league memberships (and update member counts)
3. Delete the Appwrite user account

---

## Database Schema

**Database:** `pool-league` (Appwrite NoSQL)

### Collections

**profiles**
| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | Appwrite auth user ID |
| `displayName` | string | Display name |
| `avatarUrl` | string | Profile image URL |
| `bio` | string | Short bio |

**leagues**
| Field | Type | Description |
|-------|------|-------------|
| `name` | string | League name |
| `description` | string | League description |
| `inviteCode` | string | 6-char alphanumeric join code |
| `isActive` | boolean | Soft-delete flag |
| `memberCount` | integer | Current member count |
| `pointsPerWin` | integer | Points awarded for a win |
| `pointsPerDraw` | integer | Points awarded for a draw |
| `pointsPerLoss` | integer | Points awarded for a loss |
| `includeFramePoints` | boolean | Whether frame wins add bonus points |
| `notificationDailyLimit` | integer | Max notifications per day (default 50) |

**league_members**
| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | Appwrite auth user ID |
| `leagueId` | string | League document ID |
| `role` | string | `player` (1) / `mod` (2) / `admin` (3) / `owner` (4) |
| `status` | string | `pending` / `approved` / `rejected` |

**matches**
| Field | Type | Description |
|-------|------|-------------|
| `player1Id` | string | User ID of player 1 |
| `player2Id` | string | User ID of player 2 |
| `leagueId` | string | League document ID |
| `weekCommencing` | string | Week date for scheduling |
| `scorePlayer1` | integer | Player 1 score |
| `scorePlayer2` | integer | Player 2 score |
| `frameData` | string (JSON) | Individual frame results |
| `isCompleted` | boolean | Whether the match is finished |
| `dateCompleted` | string | Completion timestamp |

**notification_logs**
| Field | Type | Description |
|-------|------|-------------|
| `leagueId` | string | League document ID |
| `date` | string | Date (YYYY-MM-DD) |
| `count` | integer | Notifications sent today |

---

## Role-Based Access Control (RBAC)

Roles are hierarchical. Higher roles inherit all permissions of lower roles.

| Role | Level | Description |
|------|-------|-------------|
| `player` | 1 | View league, edit own matches |
| `mod` | 2 | Create/edit any match |
| `admin` | 3 | Approve members, promote to mod, edit league settings |
| `owner` | 4 | Promote to admin, delete league, transfer ownership |

**Permission matrix:**

| Action | player | mod | admin | owner |
|--------|:------:|:---:|:-----:|:-----:|
| View league | x | x | x | x |
| Edit own match | x | x | x | x |
| Create match | | x | x | x |
| Edit any match | | x | x | x |
| Approve/reject members | | | x | x |
| Promote to mod | | | x | x |
| Edit league settings | | | x | x |
| Promote to admin | | | | x |
| Delete league | | | | x |
| Transfer ownership | | | | x |

RBAC is enforced in two places:
- **Client-side:** `useLeagueStore.canPerform(action)` controls UI visibility
- **Server-side:** `league-api` validates roles via `requireRole()` before executing actions

---

## CI/CD Pipelines

### CI Pipeline

**File:** `.github/workflows/e2e-tests.yml`
**Triggers:** Push to `new` or `dev` branches, pull requests to `new` or `dev`
**Runner:** `self-hosted`

Runs 8 parallel jobs:

| Job | Tool | Purpose |
|-----|------|---------|
| E2E Smoke Tests | Detox | Login + league creation flows on iOS simulator |
| Secret Detection | Gitleaks | Scans for leaked credentials (custom Appwrite API key pattern) |
| Dependency Scan | npm audit | Checks for high-severity vulnerabilities across all packages |
| SAST - JavaScript | Semgrep | Static analysis with OWASP rules + custom rules |
| SAST - Python | Bandit | Static analysis for migration scripts |
| Config Scan | Trivy | Filesystem scan for HIGH/CRITICAL config issues |
| License Check | license-checker | Fails on GPL-3.0/AGPL-3.0 licenses |
| Pipeline Summary | — | Aggregates results, fails if E2E, secrets, or license checks fail |

### iOS Release Pipeline

**File:** `.github/workflows/release.yml`
**Trigger:** GitHub Release published (fired automatically when `release-ios.sh` creates a release)
**Runner:** `self-hosted`

Steps:
1. Downloads the IPA from the release assets
2. Uploads to Diawi for OTA distribution
3. Polls Diawi status every 10s (up to 5 minutes)
4. Appends the Diawi download link to the GitHub Release notes

**Required secrets:** `DIAWI_KEY`, `APPWRITE_API_KEY`

---

## Scripts

### `scripts/deploy-functions.sh`

Deploys Appwrite serverless functions to the cloud.

```bash
export APPWRITE_API_KEY=your-api-key
./scripts/deploy-functions.sh
```

- Creates/updates function definitions and environment variables
- Uploads deployment tarballs
- Creates the FCM messaging provider (idempotent)
- Deploys: `save-push-token`, `send-push`

### `scripts/release-ios.sh`

Builds an iOS IPA locally and publishes a GitHub Release.

```bash
./scripts/release-ios.sh v1.0.0
```

Steps:
1. Validates version format (`vX.Y.Z`)
2. Checks for `gh` CLI and `eas-cli`
3. Installs dependencies (`npm ci --legacy-peer-deps`)
4. Builds IPA locally via `eas build --local`
5. Creates a GitHub Release with the IPA attached
6. Prints the release URL

**Requirements:** gh CLI (authenticated), eas-cli, Xcode + CocoaPods

---

## Testing

### E2E Tests (Detox)

Run on iOS Simulator (iPhone 17 Pro):

```bash
cd mobile
npm run test:e2e
```

**Test suites:**
- `login.test.js` — Login screen rendering, invalid credentials handling, successful login
- `league-flow.test.js` — League creation, Challenge Player navigation, Matches and Standings tabs

**Config:** `mobile/.detoxrc.js` — iPhone 17 Pro simulator, 120s setup timeout

**Test credentials:** `DETOX_TEST_EMAIL` / `DETOX_TEST_PASSWORD` env vars (defaults: `detox-test@test.local` / `TestPass1234!`)

### Unit Tests

```bash
cd appwrite/functions/leaderboard
npm test
```

17 tests covering the leaderboard scoring engine:
- Win/loss/draw calculations
- Frame points included and excluded
- Custom scoring configurations
- Ranking sort order
- Edge cases (null scores, incomplete matches)

---

## Environment Variables

### Appwrite Functions

| Variable | Description | Default |
|----------|-------------|---------|
| `APPWRITE_ENDPOINT` | Appwrite API URL | `https://appwrite.arsalan.io/v1` |
| `APPWRITE_PROJECT_ID` | Project ID | `696436a5002d6f83aed7` |
| `APPWRITE_API_KEY` | API key (required) | — |
| `APPWRITE_DATABASE_ID` | Database ID | `pool-league` |
| `PUSH_PROVIDER_ID` | Messaging provider ID | `apns-push` |
| `NOTIFICATION_DAILY_LIMIT` | Rate limit per league/day | `50` |

### CI/CD Secrets (GitHub)

| Secret | Used by | Purpose |
|--------|---------|---------|
| `APPWRITE_API_KEY` | e2e-tests.yml | E2E test authentication |
| `DIAWI_KEY` | release.yml | IPA upload to Diawi |

### E2E Test Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DETOX_TEST_EMAIL` | Test account email | `detox-test@test.local` |
| `DETOX_TEST_PASSWORD` | Test account password | `TestPass1234!` |

---

## Infrastructure

| Service | URL | Notes |
|---------|-----|-------|
| Appwrite | `https://appwrite.arsalan.io` | v1.8.1, project `696436a5002d6f83aed7` |
| Grafana | `http://172.16.2.252:3000` | Infrastructure monitoring dashboard |
| Prometheus | `http://172.16.2.252:9090` | K8s metrics (14 targets) |

**Monitoring:** A Grafana dashboard tracks container resources, HTTP/API server metrics, node metrics, network, and K8s API server/etcd. Appwrite application-level metrics (function executions, etc.) are not currently available in Prometheus.

---

## Security

See [SECURITY.md](SECURITY.md) for the full security policy, including:

- **Vulnerability reporting** — responsible disclosure process
- **Automated scanning** — Gitleaks, Semgrep, Bandit, Trivy, npm audit, license-checker
- **Secure randomness** — use `crypto.randomUUID()` / `expo-crypto`, never `Math.random()`
- **Authorization** — verify `x-appwrite-user-id` header, use `Role.user(userId)` for permissions
- **Input sanitization** — strip HTML, limit string lengths at system boundaries
- **Pre-commit hooks** — local scanning before code reaches CI

**Custom SAST rules** (`.semgreprc.yml`):
- `insecure-random` — warns on `Math.random()` usage
- `unsanitized-notification-data` — warns on unescaped user data in notifications
- `missing-userid-verification` — errors on unverified `userId` from request body

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

#!/usr/bin/env bash
#
# Build an iOS IPA locally and publish a GitHub Release.
#
# Usage: ./scripts/release-ios.sh v1.0.0
#
# Requirements:
#   - gh CLI (authenticated)
#   - eas-cli installed
#   - Xcode + CocoaPods on the Mac
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ---------------------------------------------------------------------------
# Validate arguments
# ---------------------------------------------------------------------------
if [ $# -ne 1 ]; then
  echo "Usage: $0 <version>"
  echo "  e.g. $0 v1.0.0"
  exit 1
fi

VERSION="$1"

if ! echo "$VERSION" | grep -qE '^v[0-9]+\.[0-9]+\.[0-9]+$'; then
  echo "ERROR: Version must match format vX.Y.Z (e.g. v1.0.0)"
  exit 1
fi

# ---------------------------------------------------------------------------
# Preflight checks
# ---------------------------------------------------------------------------
if ! command -v gh &> /dev/null; then
  echo "ERROR: gh CLI is not installed. Install from https://cli.github.com"
  exit 1
fi

if ! gh auth status &> /dev/null; then
  echo "ERROR: gh CLI is not authenticated. Run 'gh auth login' first."
  exit 1
fi

# Ensure a default repo is set (needed for gh release)
REMOTE_URL=$(git -C "$PROJECT_ROOT" remote get-url origin 2>/dev/null || true)
if [ -n "$REMOTE_URL" ]; then
  REPO_SLUG=$(echo "$REMOTE_URL" | sed -E 's#.*github\.com[:/]##' | sed 's/\.git$//')
  gh repo set-default "$REPO_SLUG" 2>/dev/null || true
fi

if ! command -v eas &> /dev/null; then
  echo "ERROR: eas-cli is not installed. Run 'npm install -g eas-cli'"
  exit 1
fi

# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------
echo "==> Building iOS IPA for ${VERSION} …"
cd "$PROJECT_ROOT/mobile"

echo "==> Installing dependencies …"
npm ci --legacy-peer-deps

echo "==> Running EAS build (local) …"
eas build --platform ios --profile production --local --output ./build.ipa --non-interactive

if [ ! -f ./build.ipa ]; then
  echo "ERROR: build.ipa was not created."
  exit 1
fi

# ---------------------------------------------------------------------------
# Create GitHub Release
# ---------------------------------------------------------------------------
if gh release view "$VERSION" &>/dev/null; then
  echo "ERROR: Release ${VERSION} already exists."
  rm -f ./build.ipa
  exit 1
fi

echo "==> Creating GitHub Release ${VERSION} …"
gh release create "$VERSION" ./build.ipa \
  --title "Release ${VERSION}" \
  --generate-notes

RELEASE_URL=$(gh release view "$VERSION" --json url -q '.url')

# ---------------------------------------------------------------------------
# Cleanup
# ---------------------------------------------------------------------------
rm -f ./build.ipa

echo ""
echo "==> Release created successfully!"
echo "    ${RELEASE_URL}"
echo ""
echo "    The release pipeline will automatically upload the IPA to Diawi."

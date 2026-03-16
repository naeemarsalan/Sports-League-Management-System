---
description: Build iOS IPA and create a GitHub Release
---

Build and release the iOS app.

Steps:
1. Verify prerequisites: `gh` CLI authenticated, `eas-cli` installed, Xcode available
2. Check current version in `mobile/app.json`
3. Run `scripts/release-ios.sh <version>` (version format: vX.Y.Z)
4. Monitor build progress
5. Report the GitHub Release URL when complete

The release pipeline will automatically upload the IPA to Diawi for distribution.

EAS build profiles are in `mobile/eas.json`:
- `development` - debug builds
- `preview` - ad-hoc distribution
- `production` - App Store / release builds

$ARGUMENTS - Version tag (e.g., v1.0.0)

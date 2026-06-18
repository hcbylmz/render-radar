#!/usr/bin/env bash
set -euo pipefail

# Release helper: bumps the version, tags it, and pushes so CI publishes to npm.
#
# Usage:
#   ./scripts/release.sh [patch|minor|major|<explicit-version>]
#
# Defaults to "patch" when no argument is given. The pushed v* tag triggers
# .github/workflows/publish.yml, which publishes to npm via OIDC.

BUMP="${1:-patch}"
REMOTE="origin"
BRANCH="main"

# 1. Must be on the release branch.
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
  echo "Releases must run from '$BRANCH' (currently on '$CURRENT_BRANCH')." >&2
  exit 1
fi

# 2. Working tree must be clean (npm version would refuse anyway, but fail early).
if [ -n "$(git status --porcelain)" ]; then
  echo "Working tree is not clean. Commit or stash your changes first." >&2
  exit 1
fi

# 3. Sync with the remote so the tag sits on top of the latest main.
git pull --ff-only "$REMOTE" "$BRANCH"

# 4. Fail fast locally before tagging anything.
echo "Running tests and type check..."
npm test
npm run typecheck

# 5. Bump the version; this creates a commit and a matching git tag.
NEW_VERSION="$(npm version "$BUMP" -m "chore: release v%s")"
echo "Bumped to $NEW_VERSION"

# 6. Push the commit and the tag. The v* tag starts the publish workflow.
git push --follow-tags "$REMOTE" "$BRANCH"

echo ""
echo "Pushed $NEW_VERSION."
echo "Watch the publish run: https://github.com/hcbylmz/render-radar/actions"

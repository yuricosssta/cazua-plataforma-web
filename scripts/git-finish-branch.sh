#!/usr/bin/env bash
set -euo pipefail

MAIN_BRANCH="${1:-main}"
BRANCH="${2:-$(git rev-parse --abbrev-ref HEAD)}"

# Ensure branch is checked out
CURRENT="$(git rev-parse --abbrev-ref HEAD)"
if [ "$CURRENT" != "$BRANCH" ]; then
  git checkout "$BRANCH"
fi

# Push the branch to remote (use when ready to open PR)
git push -u origin "$BRANCH"
echo "Pushed $BRANCH to origin. Open the PR manually in GitHub and approve it via browser."

echo "After merge, run: ./scripts/git-delete-local-branch.sh $BRANCH"

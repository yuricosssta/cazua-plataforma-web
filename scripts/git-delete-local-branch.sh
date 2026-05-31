#!/usr/bin/env bash
set -euo pipefail

BRANCH="${1:?branch name required}"
MAIN_BRANCH="${2:-main}"

git checkout "$MAIN_BRANCH"
git pull --ff-only origin "$MAIN_BRANCH"

# Delete local branch (safe delete first, force if needed)
git branch -d "$BRANCH" || git branch -D "$BRANCH"

echo "Local branch $BRANCH deleted."

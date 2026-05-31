#!/usr/bin/env bash
set -euo pipefail

MAIN_BRANCH="${1:-main}"
BRANCH="${2:?branch name required}"

git fetch origin
git checkout "$MAIN_BRANCH"
git pull --ff-only origin "$MAIN_BRANCH"
git checkout -b "$BRANCH"

echo "Branch created: $BRANCH (based on $MAIN_BRANCH)"

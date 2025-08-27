#!/bin/bash

# This script tells Vercel whether to build or skip the deployment
# Exit code 0 means "skip build"
# Exit code 1 means "proceed with build"

echo "VERCEL_GIT_COMMIT_REF: $VERCEL_GIT_COMMIT_REF"

# Only build for main (production) and dev (preview) branches
if [[ "$VERCEL_GIT_COMMIT_REF" == "main" || "$VERCEL_GIT_COMMIT_REF" == "dev" ]]; then
  # Proceed with build
  echo "✅ Building for branch: $VERCEL_GIT_COMMIT_REF"
  exit 1
else
  # Skip build for all other branches
  echo "🚫 Skipping build for branch: $VERCEL_GIT_COMMIT_REF"
  exit 0
fi
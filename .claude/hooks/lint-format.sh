#!/usr/bin/env bash
set -euo pipefail

# Read hook JSON from stdin
input="$(cat)"

# Extract file_path from tool_input
file_path="$(echo "$input" | jq -r '.tool_input.file_path // empty')"

if [[ -z "$file_path" ]]; then
  exit 0
fi

# Resolve to absolute path relative to project root
cd "$(dirname "$0")/../.."
project_root="$(pwd)"

case "$file_path" in
  *.ts | *.tsx)
    npx prettier --write "$file_path" 2>/dev/null
    npx eslint --fix "$file_path" 2>/dev/null || true
    ;;
  *.rs)
    rustfmt "$file_path" 2>/dev/null || true
    ;;
esac

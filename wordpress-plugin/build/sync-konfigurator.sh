#!/usr/bin/env bash
# sync-konfigurator.sh
# Baut die Next.js-App und kopiert den Static Export in das Plugin.
#
# Ausführen vom Repo-Root:
#   ./wordpress-plugin/build/sync-konfigurator.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
APP_DIR="$REPO_ROOT/app"
TARGET="$REPO_ROOT/wordpress-plugin/kw-pv-tools/assets/konfigurator"

# 1. Next.js-App bauen
echo "[sync] Baue Next.js-App..."
(
  cd "$APP_DIR"
  NEXT_PUBLIC_API_BASE="/wp-json/kw-pv-tools/v1" pnpm build
)

# 2. Sync nach Plugin
echo "[sync] Kopiere nach $TARGET ..."
rm -rf "$TARGET"
mkdir -p "$TARGET"
cp -R "$APP_DIR/out/." "$TARGET/"

echo "[sync] Fertig. Plugin-Assets unter: $TARGET"
echo "[sync] Manifest:"
cat "$TARGET/kw-pv-tools-manifest.json" | grep -E '"version"|"generatedAt"' || true

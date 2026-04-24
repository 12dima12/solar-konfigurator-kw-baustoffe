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
# NEXT_BUILD_CPUS=1 ist für den CI-Container (OpenVZ, numproc=1100) nötig,
# sonst schlägt "Collecting page data" mit EAGAIN beim spawn fehl. Auf
# normalen Dev-Maschinen kann der Wert überschrieben oder weggelassen werden.
echo "[sync] Baue Next.js-App..."
(
  cd "$APP_DIR"
  NEXT_PUBLIC_API_BASE="/wp-json/kw-pv-tools/v1" \
  NEXT_PUBLIC_ASSET_PREFIX="/wp-content/plugins/kw-pv-tools/assets/konfigurator" \
  NEXT_BUILD_CPUS="${NEXT_BUILD_CPUS:-1}" \
  pnpm build
)

# 2. Sync nach Plugin
echo "[sync] Kopiere nach $TARGET ..."
rm -rf "$TARGET"
mkdir -p "$TARGET"
cp -R "$APP_DIR/out/." "$TARGET/"

echo "[sync] Fertig. Plugin-Assets unter: $TARGET"
echo "[sync] Manifest:"
cat "$TARGET/kw-pv-tools-manifest.json" | grep -E '"version"|"generatedAt"' || true

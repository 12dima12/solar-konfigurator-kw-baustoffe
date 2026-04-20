#!/usr/bin/env bash
# package.sh
# Erzeugt ein installierbares WordPress-Plugin-ZIP.
#
# Ausführen vom Repo-Root:
#   ./wordpress-plugin/build/package.sh
#
# Voraussetzung: sync-konfigurator.sh wurde vorher ausgeführt.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PLUGIN_DIR="$REPO_ROOT/wordpress-plugin/kw-pv-tools"
BUILDS_DIR="$REPO_ROOT/wordpress-plugin/builds"

# Version aus Plugin-Hauptdatei lesen
VERSION=$(grep 'Version:' "$PLUGIN_DIR/kw-pv-tools.php" | head -1 | awk '{print $NF}')
OUTPUT="$BUILDS_DIR/kw-pv-tools-v${VERSION}.zip"

mkdir -p "$BUILDS_DIR"

# Composer-Dependencies (Production, keine Dev-Dependencies)
if [ -f "$PLUGIN_DIR/composer.json" ] && command -v composer &>/dev/null; then
    echo "[package] Installiere Composer-Dependencies..."
    (cd "$PLUGIN_DIR" && composer install --no-dev --optimize-autoloader --quiet)
fi

# ZIP erstellen
echo "[package] Erstelle $OUTPUT ..."
rm -f "$OUTPUT"
cd "$REPO_ROOT/wordpress-plugin"
zip -r "$OUTPUT" "kw-pv-tools" \
    -x "*/node_modules/*" \
    -x "*/.git/*" \
    -x "*/.DS_Store" \
    -x "*/builds/*" \
    -x "*/.gitkeep"

SIZE=$(du -sh "$OUTPUT" | cut -f1)
echo "[package] Fertig: $OUTPUT ($SIZE)"
echo "[package] Upload unter WP-Admin → Plugins → Neu hinzufügen → Plugin hochladen"

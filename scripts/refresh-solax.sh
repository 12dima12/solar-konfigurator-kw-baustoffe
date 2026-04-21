#!/usr/bin/env bash
#
# Lädt aktuelle SolaX-Produktdaten vom GBC-Solino-Konfigurator
# und aktualisiert app/src/manufacturers/solax/catalog.json
#
# Usage: ./scripts/refresh-solax.sh
#

set -e

BASE="https://ops.gbc-solino.at/solax-konfigurator"
CONFIGS=("inverter" "backup" "battery" "wallbox")
LANGS=("de" "en" "cs")
OUT_DIR="./app/src/manufacturers/solax/_refresh"

mkdir -p "$OUT_DIR"

echo "Fetching SolaX data from GBC-Solino..."

for config in "${CONFIGS[@]}"; do
  for lang in "${LANGS[@]}"; do
    URL="${BASE}/inc/filter-config-refactored.php?configFile=${config}&lang=${lang}"
    OUT="${OUT_DIR}/${config}_${lang}.json"

    echo "  ${config} / ${lang}..."
    curl -sS -o "$OUT" \
      -H "Referer: ${BASE}/" \
      -H "User-Agent: Mozilla/5.0" \
      "$URL"
    sleep 1
  done
done

echo ""
echo "Changes vs. current catalog:"
diff -q "$OUT_DIR" "./app/src/manufacturers/solax/raw/" || true

echo ""
echo "Done. Review the files in ${OUT_DIR}/"
echo "If everything looks good, run:"
echo "  cp ${OUT_DIR}/*.json ./app/src/manufacturers/solax/raw/"
echo "  # then rebuild catalog.json with the merge script (or manually)"
echo "  node scripts/strip-info-html.mjs  # converts HTML info fields to structured data"
echo "  pnpm build  # validates + builds"

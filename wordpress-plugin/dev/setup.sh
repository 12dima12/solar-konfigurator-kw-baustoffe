#!/usr/bin/env bash
# KW PV Tools — one-shot setup for the local smoke-test environment.
#
# Run AFTER `docker compose up -d`. Idempotent — you can run it repeatedly
# without duplicating work.
#
#   cd wordpress-plugin/dev
#   docker compose up -d
#   ./setup.sh
#
# Does the following, via WP-CLI inside the `wpcli` container:
#   1. Wait for MySQL to accept connections.
#   2. Install WordPress (if not yet installed) with fixed admin/admin creds.
#   3. Drop a privacy-policy page and wire it into Settings → Privacy.
#   4. Activate the kw-pv-tools plugin.
#   5. Set KW PV Tools settings to sane defaults (altcha HMAC etc.).
#   6. Drop a page `/konfigurator/` containing [kw_pv_konfigurator].
#   7. Print the URLs to click.

set -euo pipefail

# Resolve compose command — both "docker compose" (v2) and "docker-compose" (v1)
if docker compose version &>/dev/null; then
    DC="docker compose"
elif command -v docker-compose &>/dev/null; then
    DC="docker-compose"
else
    echo "ERROR: neither 'docker compose' nor 'docker-compose' is installed." >&2
    exit 1
fi

cd "$(dirname "$0")"

WPCLI="$DC exec -T wpcli wp --allow-root"

echo "[1/7] Waiting for MySQL to be ready…"
for i in $(seq 1 60); do
    if $DC exec -T db mysqladmin ping -h localhost -uroot -proot --silent 2>/dev/null; then
        echo "   MySQL is up."
        break
    fi
    sleep 1
    [ "$i" = "60" ] && { echo "   timed out waiting for MySQL." >&2; exit 1; }
done

echo "[2/7] Installing WordPress (if needed)…"
if ! $WPCLI core is-installed 2>/dev/null; then
    $WPCLI core install \
        --url="http://localhost:8080" \
        --title="KW PV Tools Dev" \
        --admin_user="admin" \
        --admin_password="admin" \
        --admin_email="admin@kw-pv-tools.test" \
        --skip-email
    echo "   Installed. Login: admin / admin"
else
    echo "   WordPress already installed — skipping."
fi

echo "[3/7] Ensuring privacy policy page exists and is published…"
PRIVACY_ID=$($WPCLI option get wp_page_for_privacy_policy 2>/dev/null || echo "0")
if [ "$PRIVACY_ID" = "0" ] || ! $WPCLI post get "$PRIVACY_ID" --field=post_status 2>/dev/null | grep -q publish; then
    PRIVACY_ID=$($WPCLI post create --post_type=page --post_status=publish \
        --post_title="Datenschutzerklärung" \
        --post_content="Diese Seite erklärt die Verarbeitung personenbezogener Daten. (Platzhalter für die Smoke-Test-Umgebung.)" \
        --porcelain)
    $WPCLI option update wp_page_for_privacy_policy "$PRIVACY_ID"
    echo "   Privacy page created: ID $PRIVACY_ID"
else
    echo "   Privacy page already wired up: ID $PRIVACY_ID"
fi

echo "[4/7] Activating kw-pv-tools plugin…"
$WPCLI plugin activate kw-pv-tools 2>&1 | sed 's/^/   /' || true

echo "[5/7] Ensuring Altcha HMAC key is set…"
HMAC=$($WPCLI eval '$o=get_option("kw_pv_tools_settings",[]); echo $o["altcha_hmac_key"] ?? "";')
if [ -z "$HMAC" ]; then
    $WPCLI eval '
        $o=get_option("kw_pv_tools_settings",[]);
        $o["altcha_hmac_key"]=wp_generate_password(32,false);
        update_option("kw_pv_tools_settings",$o);
        echo "   generated new HMAC key\n";
    '
else
    echo "   HMAC key already present — skipping."
fi

echo "[6/7] Ensuring /konfigurator page with shortcode exists…"
if ! $WPCLI post list --post_type=page --name=konfigurator --format=count 2>/dev/null | grep -q '^1$'; then
    $WPCLI post create --post_type=page --post_status=publish \
        --post_title="PV-Konfigurator" \
        --post_name="konfigurator" \
        --post_content='[kw_pv_konfigurator]' >/dev/null
    echo "   Page created."
else
    echo "   Page already exists."
fi

echo "[7/7] Done."
cat <<EOF

──────────────────────────────────────────────────────────────────
  WordPress admin :  http://localhost:8080/wp-admin
                     admin / admin
  Konfigurator    :  http://localhost:8080/konfigurator/
  MailHog inbox   :  http://localhost:8025
  KW PV Tools UI  :  http://localhost:8080/wp-admin/options-general.php?page=kw-pv-tools

  Next step       :  walk through docs/SMOKE_TEST.md
──────────────────────────────────────────────────────────────────

NOTE: If you haven't yet run  sync-konfigurator.sh  to build the
      React bundle into the plugin's assets/konfigurator/ folder,
      the shortcode will render an admin error "Manifest nicht
      gefunden". Run it once, then reload the page:

        cd ../../       # back to repo root
        ./wordpress-plugin/build/sync-konfigurator.sh
EOF

/**
 * API-Endpunkt-Konfiguration
 *
 * Diese statische App hat keine eigenen API-Routes mehr.
 * Alle Calls gehen an externe Endpunkte, die vom WordPress-Plugin
 * (Phase 10) bereitgestellt werden.
 *
 * Dev-Mode:
 *   NEXT_PUBLIC_API_BASE=http://localhost:8080/wp-json/kw-pv-tools/v1
 *
 * Produktion:
 *   NEXT_PUBLIC_API_BASE=/wp-json/kw-pv-tools/v1
 *   (Same-Origin, wenn App vom gleichen WP-Host ausgeliefert wird)
 */

const DEFAULT_BASE = "/wp-json/kw-pv-tools/v1";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? DEFAULT_BASE;

export const API_ROUTES = {
  submit: `${API_BASE}/submit`,
  captchaConfig: `${API_BASE}/captcha/config`,
  captchaChallenge: `${API_BASE}/captcha/altcha/challenge`,
} as const;

/**
 * WordPress REST-API Nonce für authentifizierte Requests.
 * Wird vom WP-Plugin via wp_localize_script bereitgestellt:
 *   window.KW_PV_TOOLS = { nonce: '...', apiBase: '...' }
 *
 * In Dev (ohne WordPress): kein Nonce nötig.
 */
export function getApiHeaders(): HeadersInit {
  const nonce =
    typeof window !== "undefined"
      ? (window as { KW_PV_TOOLS?: { nonce?: string } }).KW_PV_TOOLS?.nonce
      : undefined;

  return {
    "Content-Type": "application/json",
    ...(nonce ? { "X-WP-Nonce": nonce } : {}),
  };
}

/**
 * Falls das WP-Plugin eine alternative API-Base setzt (via wp_localize_script),
 * diese bevorzugen — erlaubt Umkonfiguration ohne Rebuild.
 */
export function getApiBase(): string {
  if (typeof window !== "undefined") {
    const wpBase = (window as { KW_PV_TOOLS?: { apiBase?: string } }).KW_PV_TOOLS?.apiBase;
    if (wpBase) return wpBase;
  }
  return API_BASE;
}

export function route(name: keyof typeof API_ROUTES): string {
  const base = getApiBase();
  return API_ROUTES[name].replace(API_BASE, base);
}

/**
 * Datenschutz-Seite — vom WP-Shortcode via `data-kw-privacy-url`
 * durchgereicht (Fallback im Plugin: `get_privacy_policy_url()`).
 * Leerer String → kein Link im Frontend; der System-Check flaggt das
 * separat als "Datenschutzseite nicht konfiguriert".
 */
export function getPrivacyUrl(): string {
  if (typeof window === "undefined") return "";
  return (
    (window as { KW_PV_TOOLS?: { privacyUrl?: string } }).KW_PV_TOOLS?.privacyUrl ?? ""
  );
}

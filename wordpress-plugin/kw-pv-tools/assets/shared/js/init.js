/**
 * KW PV Tools — Bootstrap + Preset-Initialisierung.
 *
 * Liest alle Konfigurations-Werte aus data-*-Attributen des Container-Elements.
 * Ersetzt das frühere Inline-<script>-Pattern — kein unsafe-inline nötig.
 */
(function () {
  var container = document.currentScript
    ? document.currentScript.closest('[data-kw-api-base]')
    : document.querySelector('[data-kw-api-base]');

  if (!container) return;

  // Bootstrap-Objekt setzen (wird von der React-App vor Hydration erwartet)
  window.KW_PV_TOOLS = {
    apiBase: container.dataset.kwApiBase  || '',
    nonce:   container.dataset.kwNonce   || '',
    lang:    container.dataset.kwLang    || 'de',
    version: container.dataset.kwVersion || '',
  };

  // Preset via Event-Bus weiterleiten, sobald App bereit ist
  var presetsRaw = container.dataset.kwPresets;
  if (presetsRaw) {
    try {
      var presets = JSON.parse(presetsRaw);
      window.addEventListener('kw-pv-tools:app-ready', function () {
        window.dispatchEvent(new CustomEvent('kw-pv-tools:preset', { detail: presets }));
      }, { once: true });
    } catch (e) {
      // Ungültige Presets — ignorieren
    }
  }
})();

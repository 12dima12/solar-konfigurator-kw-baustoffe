/**
 * KW PV Tools Event-Bus
 *
 * Minimale Helper-Funktionen für die Kommunikation zwischen Werkzeugen.
 * Nutzt Window CustomEvents — kein Framework, keine Abhängigkeiten.
 *
 * Events:
 *   kw-pv-tools:app-ready             — Konfigurator gemountet
 *   kw-pv-tools:preset                — Vorauswahl setzen { kWp, batteryKwh }
 *   kw-pv-tools:recommendation        — Empfehlung vom Solarrechner { kWp, batteryKwh, source }
 *   kw-pv-tools:submission-complete   — Formular abgesendet { id, products, manufacturer }
 */
(function () {
  'use strict';

  if (window.KW_PV_TOOLS_EVENT_BUS) return;

  window.KW_PV_TOOLS_EVENT_BUS = {
    emit: function (name, detail) {
      window.dispatchEvent(
        new CustomEvent('kw-pv-tools:' + name, { detail: detail, bubbles: false })
      );
    },
    on: function (name, callback) {
      window.addEventListener('kw-pv-tools:' + name, callback);
    },
    off: function (name, callback) {
      window.removeEventListener('kw-pv-tools:' + name, callback);
    },
  };

  // Debug-Modus: localStorage.setItem('kw-pv-tools:debug', '1')
  if (typeof localStorage !== 'undefined' && localStorage.getItem('kw-pv-tools:debug')) {
    var debugEvents = ['app-ready', 'preset', 'recommendation', 'submission-complete'];
    debugEvents.forEach(function (evt) {
      window.addEventListener('kw-pv-tools:' + evt, function (e) {
        console.log('[kw-pv-tools]', evt, e.detail);
      });
    });
  }
})();

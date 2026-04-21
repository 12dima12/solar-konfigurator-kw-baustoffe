<?php
namespace KW_PV_Tools\Core;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Event-Bus für Kommunikation zwischen Werkzeugen.
 *
 * Aktuell: Basis-JS laden. In Phase 11 aktiv genutzt.
 *
 * JavaScript-API:
 *
 *   KW_PV_TOOLS_EVENT_BUS.emit('recommendation', { kWp: 10, batteryKwh: 10, source: 'solarrechner' });
 *   KW_PV_TOOLS_EVENT_BUS.on('recommendation', (e) => { console.log(e.detail); });
 *
 * Unterstützte Events:
 *   kw-pv-tools:app-ready          — Konfigurator gemountet und bereit
 *   kw-pv-tools:preset             — Vorauswahl setzen { kWp, batteryKwh }
 *   kw-pv-tools:recommendation     — Empfehlung vom Solarrechner { kWp, batteryKwh, source }
 *   kw-pv-tools:submission-complete — Formular abgesendet { id, products, manufacturer }
 */
class EventBus {

    public static function register(): void {
        add_action( 'wp_enqueue_scripts', [ __CLASS__, 'enqueue' ], 5 );
    }

    public static function enqueue(): void {
        wp_register_script(
            'kw-pv-tools-event-bus',
            KW_PV_TOOLS_URL . 'assets/shared/js/event-bus.js',
            [],
            KW_PV_TOOLS_VERSION,
            false // im <head>, vor allem anderen
        );

        // Init-Script: liest Bootstrap-Daten aus data-*-Attributen des Containers.
        // Ersetzt das Inline-<script>-Pattern — kein unsafe-inline erforderlich.
        wp_register_script(
            'kw-pv-tools-init',
            KW_PV_TOOLS_URL . 'assets/shared/js/init.js',
            [ 'kw-pv-tools-event-bus' ],
            KW_PV_TOOLS_VERSION,
            true // im <body> nach Event-Bus
        );
    }
}

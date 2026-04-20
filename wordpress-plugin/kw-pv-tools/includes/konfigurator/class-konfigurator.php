<?php
namespace KW_PV_Tools\Konfigurator;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Konfigurator-Modul.
 * Koordiniert Shortcode, Block und Submit-Handler.
 */
class Konfigurator {

    public static function register(): void {
        Shortcode::register();
        Block::register();
    }
}

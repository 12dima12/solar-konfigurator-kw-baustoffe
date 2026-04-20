<?php
/**
 * Plugin Name:       KW PV Tools
 * Plugin URI:        https://github.com/12dimal2/solar-konfigurator-kw-baustoffe
 * Description:       PV-Werkzeuge für KW Baustoffe: Konfigurator, Solarrechner.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            KW Baustoffe GmbH
 * License:           Proprietary
 * Text Domain:       kw-pv-tools
 * Domain Path:       /languages
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'KW_PV_TOOLS_VERSION',  '1.0.0' );
define( 'KW_PV_TOOLS_PATH',     plugin_dir_path( __FILE__ ) );
define( 'KW_PV_TOOLS_URL',      plugin_dir_url( __FILE__ ) );
define( 'KW_PV_TOOLS_BASENAME', plugin_basename( __FILE__ ) );

// Composer-Autoload (Altcha-PHP-Bibliothek)
if ( file_exists( KW_PV_TOOLS_PATH . 'vendor/autoload.php' ) ) {
    require_once KW_PV_TOOLS_PATH . 'vendor/autoload.php';
}

// Core
require_once KW_PV_TOOLS_PATH . 'includes/core/class-settings.php';
require_once KW_PV_TOOLS_PATH . 'includes/core/class-rest-api.php';
require_once KW_PV_TOOLS_PATH . 'includes/core/class-rate-limit.php';
require_once KW_PV_TOOLS_PATH . 'includes/core/class-captcha.php';
require_once KW_PV_TOOLS_PATH . 'includes/core/class-mailer.php';
require_once KW_PV_TOOLS_PATH . 'includes/core/class-assets.php';
require_once KW_PV_TOOLS_PATH . 'includes/core/class-admin.php';
require_once KW_PV_TOOLS_PATH . 'includes/core/class-event-bus.php';
require_once KW_PV_TOOLS_PATH . 'includes/core/class-plugin.php';

// Konfigurator-Modul
require_once KW_PV_TOOLS_PATH . 'includes/konfigurator/class-konfigurator.php';
require_once KW_PV_TOOLS_PATH . 'includes/konfigurator/class-shortcode.php';
require_once KW_PV_TOOLS_PATH . 'includes/konfigurator/class-block.php';
require_once KW_PV_TOOLS_PATH . 'includes/konfigurator/class-submit-handler.php';

add_action( 'plugins_loaded', function () {
    KW_PV_Tools\Plugin::instance();
} );

register_activation_hook( __FILE__, function () {
    $defaults = [
        'captcha_provider'          => 'altcha',
        'altcha_hmac_key'           => wp_generate_password( 32, false ),
        'altcha_complexity'         => 100000,
        'captcha_hcaptcha_secret'   => '',
        'captcha_hcaptcha_sitekey'  => '',
        'captcha_recaptcha_secret'  => '',
        'captcha_recaptcha_sitekey' => '',
        'sales_email'               => get_option( 'admin_email' ),
        'from_email'                => get_option( 'admin_email' ),
        'rate_limit_per_hour'       => 3,
        'default_lang'              => 'de',
    ];
    add_option( 'kw_pv_tools_settings', $defaults );
} );

register_deactivation_hook( __FILE__, '__return_true' );

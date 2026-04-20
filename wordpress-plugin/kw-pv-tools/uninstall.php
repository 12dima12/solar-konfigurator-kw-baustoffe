<?php
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) exit;

delete_option( 'kw_pv_tools_settings' );

// Rate-Limit-Transients aufräumen
global $wpdb;
$wpdb->query(
    "DELETE FROM {$wpdb->options}
     WHERE option_name LIKE '_transient_kw_pv_tools_rl_%'
        OR option_name LIKE '_transient_timeout_kw_pv_tools_rl_%'"
);

<?php
/**
 * Runs exactly once when the plugin is uninstalled via WP-Admin.
 * WordPress only includes this file if the user chose "Delete" from the
 * plugins list (not on simple deactivation).
 *
 * DSGVO-relevant: the submissions log stores lead contact data (name,
 * email, phone, free-text message). Leaving it behind after an uninstall
 * would mean the customer never truly removed the data. Everything the
 * plugin writes must be removed here.
 *
 * Multisite-aware: if the plugin was network-active, we iterate every
 * blog so that per-site options, CPT posts and scheduled events are all
 * dropped. On single-site this path collapses to one iteration.
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) exit;

/**
 * Drop every trace of the plugin from the current site context.
 * Called from the multisite/single-site dispatcher below.
 */
function kw_pv_tools_uninstall_single_site(): void {
    global $wpdb;

    // ─── 1. Plugin settings ─────────────────────────────────────────────
    delete_option( 'kw_pv_tools_settings' );

    // ─── 2. Dismissible admin notices ──────────────────────────────────
    delete_option( 'kw_pv_tools_smtp_notice_dismissed' );

    // ─── 3. Ticket-ID counters ─────────────────────────────────────────
    // Current layout (one option per year, since B3): kw_pv_tools_ticket_counter_<YEAR>
    // Legacy shared counter + year option: kw_pv_tools_ticket_counter, kw_pv_tools_ticket_year
    $wpdb->query( $wpdb->prepare(
        "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s",
        $wpdb->esc_like( 'kw_pv_tools_ticket_counter' ) . '%'
    ) );
    delete_option( 'kw_pv_tools_ticket_year' );

    // ─── 4. Rate-limit state ───────────────────────────────────────────
    // Current layout (since B1 / 9fe0bec): direct options kw_pv_rl_<md5>
    // Legacy layout: WP-Transients with prefix kw_pv_tools_rl_
    $wpdb->query( $wpdb->prepare(
        "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s",
        $wpdb->esc_like( 'kw_pv_rl_' ) . '%'
    ) );
    $wpdb->query( $wpdb->prepare(
        "DELETE FROM {$wpdb->options}
           WHERE option_name LIKE %s OR option_name LIKE %s",
        '_transient_' . $wpdb->esc_like( 'kw_pv_tools_rl_' ) . '%',
        '_transient_timeout_' . $wpdb->esc_like( 'kw_pv_tools_rl_' ) . '%'
    ) );

    // ─── 5. Altcha replay-protection transients (since B2 captcha hardening) ──
    $wpdb->query( $wpdb->prepare(
        "DELETE FROM {$wpdb->options}
           WHERE option_name LIKE %s OR option_name LIKE %s",
        '_transient_' . $wpdb->esc_like( 'kw_pv_altcha_' ) . '%',
        '_transient_timeout_' . $wpdb->esc_like( 'kw_pv_altcha_' ) . '%'
    ) );

    // ─── 6. Submissions log (CPT + post meta) ──────────────────────────
    // DSGVO: this is personal data. It MUST be deleted on uninstall.
    $post_ids = $wpdb->get_col( $wpdb->prepare(
        "SELECT ID FROM {$wpdb->posts} WHERE post_type = %s",
        'kw_pv_submission'
    ) );
    if ( ! empty( $post_ids ) ) {
        // Use wp_delete_post to fire the expected cleanup hooks for any
        // third-party plugin that mirrored the data (search indexers, etc.).
        foreach ( $post_ids as $pid ) {
            wp_delete_post( (int) $pid, true );
        }
    }

    // ─── 7. Scheduled cron event ───────────────────────────────────────
    wp_clear_scheduled_hook( 'kw_pv_tools_purge_submissions' );

    // ─── 8. Object cache ────────────────────────────────────────────────
    // Flush the options group in case anything we just deleted is still
    // sitting in Redis/Memcached as a stale value (would reappear on the
    // next get_option call until the TTL expires otherwise).
    // wp_cache_flush_group is WP 6.1+; fall back to full flush on older WP.
    if ( function_exists( 'wp_cache_flush_group' ) ) {
        wp_cache_flush_group( 'options' );
    } else {
        wp_cache_flush();
    }
}

// Single-site: one pass. Multisite + network-active: iterate every blog.
if ( is_multisite() ) {
    // get_sites() is available since WP 4.6 — our minimum is 6.0, so safe.
    $sites = function_exists( 'get_sites' ) ? get_sites( [ 'fields' => 'ids', 'number' => 0 ] ) : [];
    foreach ( $sites as $blog_id ) {
        switch_to_blog( (int) $blog_id );
        kw_pv_tools_uninstall_single_site();
        restore_current_blog();
    }
} else {
    kw_pv_tools_uninstall_single_site();
}

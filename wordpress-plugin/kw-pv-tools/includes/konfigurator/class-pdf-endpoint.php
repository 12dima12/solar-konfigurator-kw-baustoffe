<?php
namespace KW_PV_Tools\Konfigurator;

use KW_PV_Tools\Core\PdfGenerator;
use KW_PV_Tools\Core\RateLimit;
use WP_REST_Request;
use WP_REST_Response;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Streams a configuration-summary PDF for the "Konfiguration als PDF"
 * button on the SubmitSummary page — Flow A of the v2.6 PDF feature.
 *
 * Deliberately minimal: no captcha, no email, no persistence. The
 * endpoint takes the same selections payload the submit handler
 * consumes, renders a PDF with empty contact fields, and streams it
 * back. Rate-limited per-IP to cap the cost of mpdf rendering.
 */
class PdfEndpoint {

	const MAX_SELECTIONS      = 20;
	const MAX_STEPS_PER_PHASE = 10;
	const MAX_STEP_LEN        = 200;
	const MAX_PRODUCT_FIELD   = 200;
	const RATE_LIMIT_PER_MIN  = 30;

	public static function handle( WP_REST_Request $req ): WP_REST_Response {
		$ip = RateLimit::get_client_ip();
		$rl = RateLimit::check( "pdf:{$ip}", self::RATE_LIMIT_PER_MIN, 60 );
		if ( ! $rl['allowed'] ) {
			return new WP_REST_Response(
				[ 'error' => 'Too many PDF requests. Please try again in a minute.' ],
				429
			);
		}

		$body = $req->get_json_params();
		if ( ! is_array( $body ) ) {
			return new WP_REST_Response( [ 'error' => 'Invalid body' ], 400 );
		}

		$selections = self::sanitize_selections( is_array( $body['selections'] ?? null ) ? $body['selections'] : [] );
		if ( count( $selections ) === 0 ) {
			return new WP_REST_Response( [ 'error' => 'No selections to render' ], 400 );
		}

		$data = [
			'manufacturer' => sanitize_key( (string) ( $body['manufacturer'] ?? 'solax' ) ),
			'ticket'       => self::ephemeral_id(),
			'contact'      => [
				'name' => '', 'email' => '', 'phone' => '', 'message' => '',
				'address' => '', 'timeline' => '',
			],
			'selections'   => $selections,
		];

		try {
			$pdf = PdfGenerator::generate( $data );
		} catch ( \Throwable $e ) {
			error_log( '[kw-pv-tools] PDF render failed: ' . $e->getMessage() );
			return new WP_REST_Response( [ 'error' => 'PDF rendering failed' ], 500 );
		}

		// Stream PDF bytes directly to the client. WP_REST_Response cannot
		// carry binary bodies cleanly, so emit headers + body via PHP and exit.
		nocache_headers();
		header( 'Content-Type: application/pdf' );
		header( 'Content-Disposition: inline; filename="kw-pv-konfiguration.pdf"' );
		header( 'Content-Length: ' . strlen( $pdf ) );
		echo $pdf; // phpcs:ignore WordPress.Security.EscapeOutput
		exit;
	}

	/**
	 * Mirrors SubmitHandler::sanitize_selections — duplicated here so the
	 * PDF endpoint has its own validator and cannot be abused to bypass
	 * submit-side checks.
	 */
	private static function sanitize_selections( array $selections ): array {
		$valid_phases = [ 'inverter', 'backup', 'battery', 'wallbox', 'accessory', 'finish' ];
		$out          = [];
		$selections   = array_slice( $selections, 0, self::MAX_SELECTIONS );

		foreach ( $selections as $s ) {
			if ( ! is_array( $s ) ) continue;
			$phase = sanitize_key( (string) ( $s['phase'] ?? '' ) );
			if ( ! in_array( $phase, $valid_phases, true ) ) continue;

			$product = null;
			if ( isset( $s['selectedProduct'] ) && is_array( $s['selectedProduct'] ) ) {
				$sp                  = $s['selectedProduct'];
				$product             = [
					'product_name' => sanitize_text_field( self::cap( (string) ( $sp['product_name'] ?? '' ), self::MAX_PRODUCT_FIELD ) ),
					'value'        => sanitize_text_field( self::cap( (string) ( $sp['value']        ?? '' ), self::MAX_PRODUCT_FIELD ) ),
				];
				if ( isset( $sp['batteryMeta'] ) && is_array( $sp['batteryMeta'] ) ) {
					$bm                     = $sp['batteryMeta'];
					$parts                  = [];
					if ( is_array( $bm['parts'] ?? null ) ) {
						foreach ( array_slice( $bm['parts'], 0, 10 ) as $row ) {
							if ( ! is_array( $row ) ) continue;
							$label = sanitize_text_field( self::cap( (string) ( $row['label'] ?? '' ), 80 ) );
							$count = max( 0, min( 99, (int) ( $row['count'] ?? 0 ) ) );
							if ( $label !== '' && $count > 0 ) $parts[] = [ 'label' => $label, 'count' => $count ];
						}
					}
					$product['batteryMeta'] = [
						'seriesKey'   => sanitize_key( (string) ( $bm['seriesKey']   ?? '' ) ),
						'seriesLabel' => sanitize_text_field( self::cap( (string) ( $bm['seriesLabel'] ?? '' ), self::MAX_PRODUCT_FIELD ) ),
						'kwh'         => (float) ( $bm['kwh']         ?? 0 ),
						'moduleCount' => max( 0, (int) ( $bm['moduleCount'] ?? 0 ) ),
						'model'       => sanitize_text_field( self::cap( (string) ( $bm['model']       ?? '' ), 50 ) ),
						'parts'       => $parts,
					];
				}
				if ( isset( $sp['items'] ) && is_array( $sp['items'] ) ) {
					$items = [];
					foreach ( array_slice( $sp['items'], 0, 30 ) as $row ) {
						if ( ! is_array( $row ) ) continue;
						$items[] = [
							'name'     => sanitize_text_field( self::cap( (string) ( $row['name']     ?? '' ), self::MAX_PRODUCT_FIELD ) ),
							'qty'      => max( 1, (int) ( $row['qty']      ?? 1 ) ),
							'category' => sanitize_text_field( self::cap( (string) ( $row['category'] ?? '' ), 80 ) ),
						];
					}
					$product['items'] = $items;
				}
			}

			$steps_raw    = is_array( $s['steps'] ?? null ) ? $s['steps'] : [];
			$steps_capped = array_slice( $steps_raw, 0, self::MAX_STEPS_PER_PHASE );
			$steps_clean  = [];
			foreach ( $steps_capped as $step ) {
				if ( ! is_scalar( $step ) ) continue;
				$steps_clean[] = sanitize_text_field( self::cap( (string) $step, self::MAX_STEP_LEN ) );
			}

			$out[] = [
				'phase'           => $phase,
				'steps'           => $steps_clean,
				'selectedProduct' => $product,
			];
		}
		return $out;
	}

	private static function cap( string $value, int $max ): string {
		return function_exists( 'mb_substr' ) ? mb_substr( $value, 0, $max ) : substr( $value, 0, $max );
	}

	/**
	 * Ephemeral identifier for preview PDFs — never persisted, never
	 * reused. Uses date + 6 hex chars from a cryptographic RNG so two
	 * concurrent previews don't collide and the string looks distinct
	 * from real KW-PV-YYYY-NNNNN tickets.
	 */
	private static function ephemeral_id(): string {
		$suffix = bin2hex( random_bytes( 3 ) );
		return 'PV-PREVIEW-' . date( 'Ymd' ) . '-' . $suffix;
	}
}

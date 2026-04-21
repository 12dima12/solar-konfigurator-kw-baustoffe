<?php
namespace KW_PV_Tools\Core;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Baut eine PDF-Konfigurationszusammenfassung analog zum Original
 * (SolaX/GBC Bestellkonfigurator) — mit KW-Baustoffe-Branding.
 *
 * Funktional stateless: Input = validierte Submission, Output = PDF-Bytes.
 * Ruft keine DB-Writes, keine externen APIs, keine File-Persistence. Der
 * Aufrufer entscheidet, ob die Bytes an eine Mail gehängt oder direkt an
 * den Browser gestreamt werden.
 *
 * Anforderungen:
 *   - mpdf/mpdf ≥8.1 (via Composer im Plugin-Vendor)
 *   - PHP 7.4 — mpdf 8.1 unterstützt das noch; 8.2.x würde PHP ≥8.1
 *     zwingen und unser WP-7.4-Kompatibilitätsziel brechen.
 */
class PdfGenerator {

	/**
	 * @param array $data Validierte Submission mit optional contact[] und
	 *                    selections[] (wie class-submit-handler::validate
	 *                    sie liefert). Das Feld 'ticket' ist optional.
	 * @return string     PDF als Byte-Stream.
	 * @throws \RuntimeException wenn mpdf nicht verfügbar ist.
	 */
	public static function generate( array $data ): string {
		if ( ! class_exists( '\Mpdf\Mpdf' ) ) {
			throw new \RuntimeException( 'mpdf nicht verfügbar — composer install im Plugin nötig.' );
		}

		$items = self::build_item_list( $data );
		$html  = self::render_html( $data, $items );

		$tmp_dir = sys_get_temp_dir() . '/kw-pv-tools-mpdf';
		if ( ! is_dir( $tmp_dir ) ) @mkdir( $tmp_dir, 0700, true );

		$mpdf = new \Mpdf\Mpdf( [
			'format'        => 'A4',
			'margin_top'    => 14,
			'margin_bottom' => 14,
			'margin_left'   => 14,
			'margin_right'  => 14,
			'tempDir'       => $tmp_dir,
		] );
		$mpdf->SetTitle( 'KW PV Solutions — Konfiguration' );
		$mpdf->SetAuthor( 'KW Baustoffe GmbH' );
		$mpdf->WriteHTML( $html );
		return (string) $mpdf->Output( '', 'S' );
	}

	/**
	 * Synthesise a flat, ordered product table from the submission's
	 * selections. Mirrors the GBC reference output: every phase
	 * contributes zero or more rows with category + name + code + qty.
	 *
	 * @return array<int,array{category:string,name:string,code:?string,qty:int,description?:string}>
	 */
	public static function build_item_list( array $data ): array {
		$items      = [];
		$selections = is_array( $data['selections'] ?? null ) ? $data['selections'] : [];

		foreach ( $selections as $sel ) {
			$phase   = (string) ( $sel['phase'] ?? '' );
			$product = is_array( $sel['selectedProduct'] ?? null ) ? $sel['selectedProduct'] : null;
			if ( ! $product ) continue;

			$name = (string) ( $product['product_name'] ?? '' );

			switch ( $phase ) {
				case 'inverter':
					if ( $name !== '' ) {
						$items[] = [
							'category' => 'Wechselrichter',
							'name'     => $name,
							'code'     => ArticleCodes::lookup( $name ),
							'qty'      => 1,
						];
					}
					break;

				case 'backup':
					if ( $name !== '' && stripos( $name, 'kein' ) === false ) {
						$items[] = [
							'category' => 'Notstromversorgung',
							'name'     => $name,
							'code'     => ArticleCodes::lookup( $name ),
							'qty'      => 1,
						];
					}
					break;

				case 'battery':
					// Derive battery component rows from batteryMeta.moduleCount
					// so the PDF lists Master/Slave or BMS/BAT-BOX with counts
					// instead of the compact "T58 · 11.50 kWh" label.
					$meta = is_array( $product['batteryMeta'] ?? null ) ? $product['batteryMeta'] : null;
					if ( $meta ) {
						foreach ( self::battery_component_items( $meta ) as $row ) {
							$items[] = $row;
						}
					} elseif ( $name !== '' ) {
						$items[] = [
							'category' => 'Batteriekomponenten',
							'name'     => $name,
							'code'     => ArticleCodes::lookup( $name ),
							'qty'      => 1,
						];
					}
					break;

				case 'wallbox':
					// Skip "Kein Ladegerät"-style placeholders.
					if ( $name !== '' && stripos( $name, 'kein' ) === false ) {
						$items[] = [
							'category' => 'Wallbox',
							'name'     => $name,
							'code'     => ArticleCodes::lookup( $name ),
							'qty'      => 1,
						];
					}
					break;

				case 'accessory':
					$structured = is_array( $product['items'] ?? null ) ? $product['items'] : null;
					if ( $structured ) {
						foreach ( $structured as $row ) {
							$rn  = sanitize_text_field( (string) ( $row['name'] ?? '' ) );
							$rq  = max( 1, (int) ( $row['qty']  ?? 1 ) );
							$rc  = sanitize_text_field( (string) ( $row['category'] ?? 'Zubehör' ) );
							if ( $rn !== '' ) {
								$items[] = [
									'category' => $rc,
									'name'     => $rn,
									'code'     => ArticleCodes::lookup( $rn ),
									'qty'      => $rq,
								];
							}
						}
					}
					break;
			}
		}
		return $items;
	}

	/**
	 * Render battery component rows straight from the montage parts the
	 * client committed (Master/Slave/BMS/BAT BOX/Series BOX/BMS Parallel Box G1+G2).
	 * Falls back to seriesKey-derived heuristics only when the client posted
	 * no parts array (older clients pre-v2.6.4).
	 */
	private static function battery_component_items( array $meta ): array {
		$parts = is_array( $meta['parts'] ?? null ) ? $meta['parts'] : null;
		if ( is_array( $parts ) && count( $parts ) > 0 ) {
			$rows = [];
			foreach ( $parts as $p ) {
				$label = sanitize_text_field( (string) ( $p['label'] ?? '' ) );
				$count = max( 0, (int) ( $p['count'] ?? 0 ) );
				if ( $label === '' || $count === 0 ) continue;
				$rows[] = [
					'category' => 'Batteriekomponenten',
					'name'     => $label,
					'code'     => ArticleCodes::lookup( $label ),
					'qty'      => $count,
				];
			}
			return $rows;
		}

		// Legacy fallback: derive rows from moduleCount + seriesKey.
		$count  = max( 0, (int) ( $meta['moduleCount'] ?? 0 ) );
		$series = (string) ( $meta['seriesKey'] ?? '' );
		if ( $count === 0 ) return [];
		switch ( $series ) {
			case 't58':
				$out = [ [ 'category' => 'Batteriekomponenten', 'name' => 'Master', 'code' => ArticleCodes::lookup( 'Master' ), 'qty' => 1 ] ];
				if ( $count > 1 ) $out[] = [ 'category' => 'Batteriekomponenten', 'name' => 'Slave', 'code' => ArticleCodes::lookup( 'Slave' ), 'qty' => $count - 1 ];
				return $out;
			case 's25-s36':
			case 't30':
				return [
					[ 'category' => 'Batteriekomponenten', 'name' => 'BMS',     'code' => ArticleCodes::lookup( 'BMS' ),     'qty' => 1 ],
					[ 'category' => 'Batteriekomponenten', 'name' => 'BAT BOX', 'code' => ArticleCodes::lookup( 'BAT BOX' ), 'qty' => $count ],
				];
		}
		return [];
	}

	private static function render_html( array $data, array $items ): string {
		$ticket   = esc_html( (string) ( $data['ticket'] ?? '—' ) );
		$erstellt = esc_html( date_i18n( 'Y-m-d H:i:s' ) );

		$contact          = is_array( $data['contact'] ?? null ) ? $data['contact'] : [];
		$contact_name     = esc_html( (string) ( $contact['name']    ?? '' ) );
		$contact_email    = esc_html( (string) ( $contact['email']   ?? '' ) );
		$contact_phone    = esc_html( (string) ( $contact['phone']   ?? '' ) );
		$contact_message  = esc_html( (string) ( $contact['message'] ?? '' ) );
		$contact_address  = esc_html( (string) ( $contact['address'] ?? '' ) );
		$contact_timeline = esc_html( (string) ( $contact['timeline'] ?? '' ) );

		// Konfigurationsdetails — aus selections ablesen
		$selections = is_array( $data['selections'] ?? null ) ? $data['selections'] : [];
		$details    = self::extract_details( $selections );

		// Produktliste-Zeilen rendern
		$rows_html = '';
		$nr = 1;
		$total_qty = 0;
		foreach ( $items as $row ) {
			$qty = (int) $row['qty'];
			$total_qty += $qty;
			$code = $row['code'] !== null && $row['code'] !== '' ? esc_html( $row['code'] ) : '—';
			$rows_html .= sprintf(
				'<tr><td style="padding:6px 4px;">%d</td><td style="padding:6px 8px;">%s</td><td style="padding:6px 8px;">%s</td><td style="padding:6px 4px; font-family:monospace;">%s</td><td style="padding:6px 4px; text-align:right;">%d</td></tr>',
				$nr++,
				esc_html( $row['category'] ),
				esc_html( $row['name'] ),
				$code,
				$qty
			);
		}
		if ( $rows_html === '' ) {
			$rows_html = '<tr><td colspan="5" style="padding:12px; text-align:center; color:#888;">(keine Positionen)</td></tr>';
		}

		return <<<HTML
<!doctype html>
<html lang="de"><head><meta charset="utf-8">
<style>
  body { font-family: sans-serif; color: #1e3a5f; font-size: 10pt; }
  h1 { color: #1e3a5f; margin: 0 0 8px 0; font-size: 18pt; }
  .intro { color: #555; font-size: 9pt; margin-bottom: 12px; }
  h2 { background: #1e3a5f; color: #fff; padding: 6px 10px; margin: 14px 0 6px 0; font-size: 11pt; border-radius: 3px; }
  table.kv { width: 100%; border-collapse: collapse; }
  table.kv td { padding: 4px 6px; vertical-align: top; }
  table.kv td.k { color: #555; font-weight: bold; width: 35%; }
  table.items { width: 100%; border-collapse: collapse; font-size: 9pt; }
  table.items th { background: #f0f2f5; color: #1e3a5f; padding: 6px 4px; text-align: left; border-bottom: 1px solid #d0d6e0; }
  table.items tr:nth-child(even) td { background: #fafbfc; }
  table.items td { border-bottom: 1px solid #ecedf0; }
  .two-col { width: 100%; }
  .two-col td { vertical-align: top; width: 50%; padding-right: 8px; }
  .total { margin-top: 8px; text-align: right; font-weight: bold; font-size: 10pt; }
  .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #e5e7eb; color: #888; font-size: 8pt; text-align: center; }
  .notes { background: #f0f6fe; padding: 8px 12px; border-radius: 3px; color: #1e3a5f; font-size: 9pt; }
  .notes ul { margin: 4px 0; padding-left: 18px; }
</style>
</head><body>

<h1>KW PV Solutions — Konfigurationszusammenfassung</h1>
<p class="intro">Vielen Dank! Hier finden Sie die Zusammenfassung Ihrer PV-Konfiguration — bestellfertig mit Artikelcodes.</p>

<h2>Konfigurationszusammenfassung</h2>
<table class="kv">
  <tr><td class="k">Dokument-ID</td><td>{$ticket}</td></tr>
  <tr><td class="k">Erstellt</td><td>{$erstellt}</td></tr>
</table>

<table class="two-col"><tr>
<td>
  <h2>Konfigurationsdetails</h2>
  <table class="kv">
    <tr><td class="k">Installationsart</td><td>{$details['installation']}</td></tr>
    <tr><td class="k">Wechselrichtertyp</td><td>{$details['inverter_type']}</td></tr>
    <tr><td class="k">Batteriemodell</td><td>{$details['battery_model']}</td></tr>
    <tr><td class="k">Batteriekapazität</td><td>{$details['battery_capacity']}</td></tr>
  </table>
</td>
<td>
  <h2>Kundeninformationen</h2>
  <table class="kv">
    <tr><td class="k">Ansprechpartner</td><td>{$contact_name}</td></tr>
    <tr><td class="k">Telefon</td><td>{$contact_phone}</td></tr>
    <tr><td class="k">E-Mail</td><td>{$contact_email}</td></tr>
    <tr><td class="k">Adresse</td><td>{$contact_address}</td></tr>
    <tr><td class="k">Umsetzung</td><td>{$contact_timeline}</td></tr>
  </table>
</td>
</tr></table>

<h2>Produktliste</h2>
<table class="items">
  <thead><tr>
    <th style="width:8%;">Nr.</th>
    <th style="width:22%;">Kategorie</th>
    <th>Produktname</th>
    <th style="width:18%;">Artikelcode</th>
    <th style="width:10%; text-align:right;">Anzahl</th>
  </tr></thead>
  <tbody>
  {$rows_html}
  </tbody>
</table>
<p class="total">Artikel insgesamt: {$total_qty}</p>

<h2>Konfigurationsnotizen</h2>
<div class="notes">
  <ul>
    <li>Alle Mengen werden automatisch basierend auf den Systemanforderungen berechnet.</li>
    <li>Produktcodes sind bereit für die direkte Bestellung.</li>
  </ul>
</div>

<div class="footer">
  Erstellt von KW PV Solutions · KW Baustoffe GmbH · Drensteinfurt
</div>

</body></html>
HTML;
	}

	private static function extract_details( array $selections ): array {
		$out = [
			'installation'     => 'Neue Installation',
			'inverter_type'    => '—',
			'battery_model'    => '—',
			'battery_capacity' => '—',
		];

		foreach ( $selections as $sel ) {
			$phase   = (string) ( $sel['phase'] ?? '' );
			$product = is_array( $sel['selectedProduct'] ?? null ) ? $sel['selectedProduct'] : null;
			$steps   = is_array( $sel['steps'] ?? null ) ? $sel['steps'] : [];

			if ( $phase === 'inverter' ) {
				if ( in_array( 'IES', $steps, true ) || in_array( 'All in One IES', $steps, true ) || in_array( 'Alles in Einem IES', $steps, true ) ) {
					$out['inverter_type'] = 'IES';
				} elseif ( in_array( 'Three-phase inverter X3', $steps, true ) ) {
					$out['inverter_type'] = 'X3';
				} elseif ( in_array( 'Single-phase inverter X1', $steps, true ) ) {
					$out['inverter_type'] = 'X1';
				}
			}
			if ( $phase === 'battery' && $product ) {
				$meta = is_array( $product['batteryMeta'] ?? null ) ? $product['batteryMeta'] : null;
				if ( $meta ) {
					$out['battery_model']    = esc_html( (string) ( $meta['model'] ?? '—' ) );
					$out['battery_capacity'] = esc_html( sprintf( '%.1f kWh', (float) ( $meta['kwh'] ?? 0 ) ) );
				}
			}
		}
		return $out;
	}
}

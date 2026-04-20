# Neues Werkzeug ins Plugin integrieren

Das Plugin `kw-pv-tools` ist als Sammel-Plattform angelegt.
Der Konfigurator ist das erste Werkzeug. Weitere (z.B. Solarrechner in Phase 11)
werden nach folgendem Muster hinzugefügt.

## Schritte

### 1. Modul-Verzeichnis anlegen

```
includes/<werkzeug-slug>/
├── class-<werkzeug-slug>.php    # Modul-Klasse
├── class-shortcode.php          # [kw_<slug>] Shortcode
└── ...
```

### 2. Assets-Verzeichnis

```
assets/<werkzeug-slug>/
├── js/rechner.js
└── css/rechner.css
```

### 3. In kw-pv-tools.php einhängen

```php
require_once KW_PV_TOOLS_PATH . 'includes/solarrechner/class-solarrechner.php';
// etc.
```

Und in `class-plugin.php` im `__construct()`:
```php
\KW_PV_Tools\Solarrechner\Solarrechner::register();
```

### 4. Event-Bus verwenden

**Solarrechner feuert Empfehlung:**
```javascript
KW_PV_TOOLS_EVENT_BUS.emit('recommendation', {
  kWp: 10,
  batteryKwh: 10,
  source: 'solarrechner'
});
```

**Konfigurator hört und setzt Preset:**
```javascript
KW_PV_TOOLS_EVENT_BUS.on('recommendation', function(e) {
  // Preset in Konfigurator setzen
  window.dispatchEvent(new CustomEvent('kw-pv-tools:preset', { detail: e.detail }));
});
```

### 5. Beide Werkzeuge auf einer Seite

```
[kw_solarrechner]

[kw_pv_konfigurator]
```

Event-Bus verbindet sie automatisch — kein iFrame, kein Cross-Origin-Problem.

## Event-Bus-Contract

| Event | Richtung | Payload |
|---|---|---|
| `kw-pv-tools:app-ready` | Konfigurator → Host | `{}` |
| `kw-pv-tools:preset` | Host → Konfigurator | `{ kWp, batteryKwh }` |
| `kw-pv-tools:recommendation` | Solarrechner → Konfigurator | `{ kWp, batteryKwh, source }` |
| `kw-pv-tools:submission-complete` | Konfigurator → Host | `{ id, products, manufacturer }` |

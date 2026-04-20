# Security-Checkliste

## Status

| Punkt | Status | Anmerkung |
|---|---|---|
| Input-Validierung (zod) in `/api/submit` | ✓ | Schema in route.ts |
| Keine Secrets im Client-Bundle | ✓ | Alle env vars server-only |
| `.env.local` in `.gitignore` | ✓ | `.gitignore` enthält Eintrag |
| postMessage-Origin-Check | ⚠ Stub | Aktuell `"*"` — vor Produktion einschränken |
| CSP-Header | ⚠ TODO | Noch nicht konfiguriert |
| X-Frame-Options | ⚠ TODO | `/embed` braucht ALLOWALL, Rest DENY |
| Rate-Limiting `/api/submit` | ⚠ TODO | Vercel Edge Config oder upstash/ratelimit |
| reCAPTCHA/hCaptcha | ⚠ TODO | Spam-Schutz vor Submit-Button |

---

## 1. postMessage Origin einschränken (vor Produktion)

In `src/hooks/useIframeResize.ts` Zeile ändern:

```typescript
// Statt:
window.parent.postMessage({ type: "kw-configurator-resize", height }, "*");

// Nach Deployment (Produktions-Domain bekannt):
window.parent.postMessage({ type: "kw-configurator-resize", height }, "https://www.kw-baustoffe.de");
```

Und im iframe-host.html:
```javascript
if (e.origin !== "https://konfigurator.kw-baustoffe.de") return;
```

## 2. Security-Header in next.config.ts

```typescript
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/((?!embed).*)",  // Alle Seiten außer /embed
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/embed",  // iFrame-Seite
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          // X-Frame-Options absichtlich weggelassen (iFrame erlaubt)
        ],
      },
    ];
  },
};
```

## 3. Rate-Limiting (Vercel + upstash/ratelimit)

```bash
pnpm add @upstash/ratelimit @upstash/redis
```

```typescript
// src/app/api/submit/route.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 h"),
});

// In POST:
const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
const { success } = await ratelimit.limit(ip);
if (!success) return Response.json({ error: "Too many requests" }, { status: 429 });
```

## 4. Input-Sanitization für HTML-Info-Felder

Falls `info`-Felder aus dem Catalog als HTML gerendert werden (`dangerouslySetInnerHTML`),
muss DOMPurify serverseitig sanitized werden:

```bash
pnpm add isomorphic-dompurify
```

```typescript
import DOMPurify from "isomorphic-dompurify";
const clean = DOMPurify.sanitize(rawHtml);
```

Aktuell betroffen: `InfoModal.tsx` — Daten stammen von eigenem Catalog, Risiko gering.

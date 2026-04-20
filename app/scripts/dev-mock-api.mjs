/**
 * Dev-Mock-API
 *
 * Simuliert die WordPress-REST-Endpunkte für lokale Entwicklung ohne WordPress.
 *
 * Start:   node scripts/dev-mock-api.mjs
 * Läuft:   http://localhost:8080
 *
 * Dev-Workflow:
 *   Terminal 1: node scripts/dev-mock-api.mjs
 *   Terminal 2: NEXT_PUBLIC_API_BASE=http://localhost:8080/wp-json/kw-pv-tools/v1 pnpm dev
 */

import http from "node:http";
import { createChallenge } from "altcha-lib/v1";

const PORT = 8080;
const HMAC_KEY = "dev-only-mock-key";
const BASE = "/wp-json/kw-pv-tools/v1";

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-WP-Nonce");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  try {
    // GET /captcha/config
    if (path === `${BASE}/captcha/config` && req.method === "GET") {
      return json(res, {
        provider: "altcha",
        challengeUrl: `http://localhost:${PORT}${BASE}/captcha/altcha/challenge`,
      });
    }

    // GET /captcha/altcha/challenge
    if (path === `${BASE}/captcha/altcha/challenge` && req.method === "GET") {
      const challenge = await createChallenge({ hmacKey: HMAC_KEY, maxNumber: 1000 });
      return json(res, challenge);
    }

    // POST /submit
    if (path === `${BASE}/submit` && req.method === "POST") {
      const body = JSON.parse(await readBody(req));
      console.log("[mock-api] Submit received:", body.contact?.name, body.contact?.email);
      return json(res, { success: true, id: `mock-${Date.now()}` });
    }

    res.writeHead(404);
    json(res, { error: "Not found", path });
  } catch (e) {
    console.error("[mock-api] Error:", e);
    res.writeHead(500);
    json(res, { error: String(e) });
  }
});

function json(res, data) {
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

server.listen(PORT, () => {
  console.log(`[mock-api] Running on http://localhost:${PORT}`);
  console.log(`[mock-api] Endpoints:`);
  console.log(`  GET  http://localhost:${PORT}${BASE}/captcha/config`);
  console.log(`  GET  http://localhost:${PORT}${BASE}/captcha/altcha/challenge`);
  console.log(`  POST http://localhost:${PORT}${BASE}/submit`);
});

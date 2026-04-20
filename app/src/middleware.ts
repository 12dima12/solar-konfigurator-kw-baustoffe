import { NextResponse, type NextRequest } from "next/server";

// ─── Auth ────────────────────────────────────────────────────────────────────
const PASSWORD = process.env.APP_PASSWORD ?? "Account123!";
const COOKIE = "kw_auth";

// ─── iFrame-Hosts (Embed-Routen dürfen eingebettet werden) ───────────────────
const EMBED_ALLOWED_HOSTS = [
  "https://www.kw-baustoffe.de",
  "https://kw-baustoffe.de",
  "https://kw-pv-solutions.de",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Static assets + API unverändert durchleiten
  if (req.nextUrl.pathname.startsWith("/api/")) return applySecurityHeaders(NextResponse.next(), pathname);

  // Auth
  const cookie = req.cookies.get(COOKIE)?.value;
  const isAuthenticated = cookie === PASSWORD;
  const isLoginPage = pathname === "/_login";

  if (!isAuthenticated && !isLoginPage) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/_login";
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return applySecurityHeaders(NextResponse.next(), pathname);
}

function applySecurityHeaders(res: NextResponse, pathname: string): NextResponse {
  // Basis-Header für alle Routen
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  const isEmbedRoute = pathname.endsWith("/embed");

  if (isEmbedRoute) {
    // Embed-Routen: nur erlaubte Parent-Domains
    res.headers.set(
      "Content-Security-Policy",
      `frame-ancestors ${EMBED_ALLOWED_HOSTS.join(" ")}`
    );
  } else {
    // Reguläre Routen: Einbettung komplett verbieten
    res.headers.set("X-Frame-Options", "DENY");
    res.headers.set("Content-Security-Policy", "frame-ancestors 'none';");
  }

  // Erweitertes CSP
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://hcaptcha.com https://*.hcaptcha.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://hcaptcha.com https://*.hcaptcha.com",
    "frame-src https://hcaptcha.com https://*.hcaptcha.com",
    isEmbedRoute
      ? `frame-ancestors ${EMBED_ALLOWED_HOSTS.join(" ")}`
      : "frame-ancestors 'none'",
  ].join("; ");

  res.headers.set("Content-Security-Policy", csp);

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manufacturers).*)"],
};

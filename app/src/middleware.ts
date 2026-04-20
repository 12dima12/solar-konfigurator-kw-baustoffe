import { NextResponse, type NextRequest } from "next/server";

// ─── iFrame-Hosts (Embed-Routen dürfen eingebettet werden) ───────────────────
const EMBED_ALLOWED_HOSTS = [
  "https://www.kw-baustoffe.de",
  "https://kw-baustoffe.de",
  "https://kw-pv-solutions.de",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  return applySecurityHeaders(NextResponse.next(), pathname);
}

function applySecurityHeaders(res: NextResponse, pathname: string): NextResponse {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  const isEmbedRoute = pathname.endsWith("/embed");

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

  if (!isEmbedRoute) {
    res.headers.set("X-Frame-Options", "DENY");
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manufacturers).*)"],
};

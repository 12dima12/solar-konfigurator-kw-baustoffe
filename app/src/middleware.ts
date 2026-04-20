import { NextResponse, type NextRequest } from "next/server";

// ─── iFrame-Hosts (Embed-Routen dürfen eingebettet werden) ───────────────────
const EMBED_ALLOWED_HOSTS = [
  "https://www.kw-baustoffe.de",
  "https://kw-baustoffe.de",
  "https://kw-pv-solutions.de",
];

// External captcha script origins (only needed when CAPTCHA_PROVIDER != altcha)
const CAPTCHA_HOSTS = [
  "https://hcaptcha.com",
  "https://*.hcaptcha.com",
  "https://www.google.com",
  "https://www.gstatic.com",
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
  const captchaHosts = CAPTCHA_HOSTS.join(" ");

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${captchaHosts}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${captchaHosts}`,
    `frame-src ${captchaHosts}`,
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

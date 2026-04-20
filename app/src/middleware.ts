import { NextResponse, type NextRequest } from "next/server";

const PASSWORD = process.env.APP_PASSWORD ?? "Account123!";
const COOKIE = "kw_auth";

export function middleware(req: NextRequest) {
  // API-Route nicht schützen
  if (req.nextUrl.pathname.startsWith("/api/")) return NextResponse.next();

  const cookie = req.cookies.get(COOKIE)?.value;
  if (cookie === PASSWORD) return NextResponse.next();

  // Login-POST
  if (req.method === "POST" && req.nextUrl.pathname === "/_login") {
    return NextResponse.next();
  }

  // Login-Seite selbst nicht sperren
  if (req.nextUrl.pathname === "/_login") return NextResponse.next();

  // Weiterleitung zur Login-Seite
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/_login";
  loginUrl.searchParams.set("from", req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|kw-logo.svg|products/).*)"],
};

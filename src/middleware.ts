import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "owner_pin";

/** Routes that require the owner pincode */
function isOwnerRoute(pathname: string) {
  if (pathname === "/" || pathname === "/studio" || pathname === "/dashboard") return true;
  if (pathname.startsWith("/client-rooms")) return true;
  if (pathname.startsWith("/tracker")) return true;
  if (pathname.startsWith("/todos")) return true;
  if (pathname.startsWith("/api/")) return true;
  return false;
}

/** Routes that are always public */
function isPublicRoute(pathname: string) {
  if (pathname === "/pin") return true;
  if (pathname === "/api/auth/pin") return true;
  if (pathname.startsWith("/client-room/")) return true;
  if (pathname.startsWith("/api/client-rooms/assets/")) return true;
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  if (!isOwnerRoute(pathname)) {
    return NextResponse.next();
  }

  const pin = request.cookies.get(COOKIE_NAME)?.value;
  if (pin && pin.length > 0) {
    return NextResponse.next();
  }

  // API routes return 401
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Page routes redirect to /pin
  const pinUrl = new URL("/pin", request.url);
  pinUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(pinUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, logo-bnj.svg, sitemap.xml, robots.txt (static files)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|logo-bnj\\.svg|sitemap\\.xml|robots\\.txt).*)",
  ],
};

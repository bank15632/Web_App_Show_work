import { NextResponse, type NextRequest } from "next/server";

import { verifySessionToken } from "@/lib/auth/session";

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

/** Validate redirect path to prevent open redirect attacks */
function getSafeRedirectPath(raw: string): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

// Cloudflare's current OpenNext adapter still expects the Edge middleware convention.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  if (!isOwnerRoute(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const ownerPin = process.env.OWNER_PIN ?? "";
  const isValid = token && ownerPin ? await verifySessionToken(token, ownerPin) : false;

  if (isValid) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pinUrl = new URL("/pin", request.url);
  pinUrl.searchParams.set("next", getSafeRedirectPath(pathname));
  return NextResponse.redirect(pinUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|logo-bnj\\.svg|sitemap\\.xml|robots\\.txt).*)",
  ],
};

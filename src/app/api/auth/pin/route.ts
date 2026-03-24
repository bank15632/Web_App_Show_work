import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "owner_pin";
const VALID_PIN = "1150";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const pin = typeof body?.pin === "string" ? body.pin : "";

  if (pin !== VALID_PIN) {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, pin, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    // No maxAge — session cookie, expires when browser closes
  });

  return response;
}

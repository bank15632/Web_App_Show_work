import { NextResponse, type NextRequest } from "next/server";

import { createSessionToken } from "@/lib/auth/session";
import { getTrackerEnv } from "@/lib/tracker/runtime";

const COOKIE_NAME = "owner_pin";

export async function POST(request: NextRequest) {
  const env = await getTrackerEnv();
  const validPin = env.OWNER_PIN;

  if (!validPin) {
    return NextResponse.json(
      { error: "Authentication not configured" },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const pin = typeof body?.pin === "string" ? body.pin : "";

  if (pin !== validPin) {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }

  const token = await createSessionToken(validPin);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    // No maxAge — session cookie, expires when browser closes
  });

  return response;
}

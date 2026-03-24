import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

import type { TrackerEnv } from "@/lib/tracker/env";

const COOKIE_NAME = "owner_pin";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function POST(request: NextRequest) {
  const { env } = await getCloudflareContext({ async: true });
  const { OWNER_PIN } = env as TrackerEnv;

  if (!OWNER_PIN) {
    // If no PIN is configured, allow access (dev convenience)
    const response = NextResponse.json({ ok: true });
    response.cookies.set(COOKIE_NAME, "open", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
    return response;
  }

  const body = await request.json().catch(() => null);
  const pin = typeof body?.pin === "string" ? body.pin : "";

  if (pin !== OWNER_PIN) {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, pin, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  return response;
}

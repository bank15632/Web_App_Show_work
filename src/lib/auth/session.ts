const ALGORITHM = { name: "HMAC", hash: "SHA-256" } as const;
const TOKEN_PREFIX = "session:";

async function deriveKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    ALGORITHM,
    false,
    ["sign", "verify"],
  );
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Create an HMAC-based session token from the owner PIN.
 * Format: `<timestamp>.<hex-hmac>`
 */
export async function createSessionToken(pin: string): Promise<string> {
  const timestamp = Date.now().toString(36);
  const key = await deriveKey(pin);
  const data = new TextEncoder().encode(`${TOKEN_PREFIX}${timestamp}`);
  const signature = await crypto.subtle.sign(ALGORITHM.name, key, data);
  return `${timestamp}.${toHex(signature)}`;
}

/**
 * Verify that a session token was signed with the given PIN.
 */
export async function verifySessionToken(
  token: string,
  pin: string,
): Promise<boolean> {
  if (!token || !pin) return false;

  const dotIndex = token.indexOf(".");
  if (dotIndex < 1) return false;

  const timestamp = token.slice(0, dotIndex);
  const hmacHex = token.slice(dotIndex + 1);
  if (!timestamp || !hmacHex) return false;

  try {
    const key = await deriveKey(pin);
    const data = new TextEncoder().encode(`${TOKEN_PREFIX}${timestamp}`);
    const expected = await crypto.subtle.sign(ALGORITHM.name, key, data);
    return toHex(expected) === hmacHex;
  } catch {
    return false;
  }
}

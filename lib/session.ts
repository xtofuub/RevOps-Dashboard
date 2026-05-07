import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET env var is missing or too short (minimum 32 characters).",
    );
  }
  return secret;
}

export function signSession(payload: object): string {
  const data = JSON.stringify(payload);
  const encoded = Buffer.from(data).toString("base64url");
  const sig = createHmac("sha256", getSecret()).update(encoded).digest("hex");
  return `${encoded}.${sig}`;
}

export function verifySession(value: string): Record<string, unknown> | null {
  const dot = value.lastIndexOf(".");
  if (dot === -1) return null;

  const encoded = value.slice(0, dot);
  const sig = value.slice(dot + 1);

  let expectedBuf: Buffer;
  let sigBuf: Buffer;

  try {
    const expected = createHmac("sha256", getSecret())
      .update(encoded)
      .digest("hex");
    expectedBuf = Buffer.from(expected, "hex");
    sigBuf = Buffer.from(sig, "hex");
  } catch {
    return null;
  }

  if (
    sigBuf.length === 0 ||
    sigBuf.length !== expectedBuf.length ||
    !timingSafeEqual(sigBuf, expectedBuf)
  ) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const PREFIX = "arche_";

/**
 * Registry tokens (Brief #3 §6): per-user random bearer tokens for private
 * library installs. Only the SHA-256 hash is stored (profiles table);
 * the raw token is shown once at issuance and never again.
 */
export function issueRegistryToken(): { raw: string; hash: string; prefix: string } {
  const raw = `${PREFIX}${randomBytes(32).toString("base64url")}`;
  return { raw, hash: hashToken(raw), prefix: raw.slice(0, 12) };
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function verifyRegistryToken(raw: string, storedHash: string): boolean {
  if (!raw.startsWith(PREFIX) || !storedHash) {
    return false;
  }
  const candidate = Buffer.from(hashToken(raw), "hex");
  const expected = Buffer.from(storedHash, "hex");
  if (candidate.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(candidate, expected);
}

export function bearerFromHeader(header: string | null): string | null {
  if (!header) {
    return null;
  }
  const match = header.match(/^Bearer\s+(\S+)$/i);
  return match ? match[1]! : null;
}

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const PREFIX = "arche_mcp_";

export interface McpTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  label: string;
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

/** Plan-gate hook (§6): monetization wires real entitlements here. Defaults on. */
export function hostedMcpEnabled(_userId: string): boolean {
  return true;
}

export function issueMcpToken(): { raw: string; hash: string; prefix: string } {
  const raw = `${PREFIX}${randomBytes(32).toString("base64url")}`;
  return { raw, hash: hashMcpToken(raw), prefix: raw.slice(0, 16) };
}

export function hashMcpToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function verifyMcpToken(raw: string, storedHash: string): boolean {
  if (!raw.startsWith(PREFIX) || !storedHash) return false;
  const candidate = Buffer.from(hashMcpToken(raw), "hex");
  const expected = Buffer.from(storedHash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

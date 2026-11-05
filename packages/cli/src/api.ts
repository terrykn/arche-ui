/** Minimal HTTP surface the CLI needs from the Arche app (Brief #4 §5). */

export interface WhoamiResult {
  ok: true;
  username: string;
}

export interface ApiFailure {
  ok: false;
  kind: "network" | "unauthorized";
  message: string;
}

export async function verifyToken(appUrl: string, token: string): Promise<WhoamiResult | ApiFailure> {
  let response: Response;
  try {
    response = await fetch(`${appUrl}/api/cli/whoami`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    return {
      ok: false,
      kind: "network",
      message: `cannot reach the Arche app at ${appUrl} (${error instanceof Error ? error.message : String(error)})`,
    };
  }
  if (response.status === 401) {
    return { ok: false, kind: "unauthorized", message: "the stored token was rejected by the app" };
  }
  if (!response.ok) {
    return { ok: false, kind: "network", message: `the app answered ${response.status}` };
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { ok: false, kind: "network", message: "the app answered with invalid JSON" };
  }
  const username = (body as { username?: unknown }).username;
  if (typeof username !== "string" || username.length === 0) {
    return { ok: false, kind: "network", message: "the app answered without a username" };
  }
  return { ok: true, username };
}

export interface RegistryFetch {
  ok: true;
  json: string;
}

export async function fetchRegistryItem(
  url: string,
  token: string | null,
): Promise<RegistryFetch | ApiFailure> {
  let response: Response;
  try {
    response = await fetch(
      url,
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    );
  } catch (error) {
    return {
      ok: false,
      kind: "network",
      message: `cannot reach ${url} (${error instanceof Error ? error.message : String(error)})`,
    };
  }
  if (response.status === 404) {
    return { ok: false, kind: "unauthorized", message: "not found" };
  }
  if (!response.ok) {
    return { ok: false, kind: "network", message: `registry answered ${response.status}` };
  }
  return { ok: true, json: await response.text() };
}

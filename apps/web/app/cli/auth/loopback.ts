/** Loopback hosts the /cli/auth page will redirect a token to. Nothing else. */
export function isLoopbackCallback(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "http:") {
    return false;
  }
  return url.hostname === "127.0.0.1" || url.hostname === "[::1]" || url.hostname === "::1";
}

export function callbackWith(callback: string, params: Record<string, string>): string {
  const url = new URL(callback);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

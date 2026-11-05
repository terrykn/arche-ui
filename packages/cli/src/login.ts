import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { verifyToken } from "./api.js";
import { loadConfig, resolveAppUrl, saveConfig } from "./config.js";

const CALLBACK_TIMEOUT_MS = 120_000;

function openBrowser(url: string): void {
  // Argument arrays throughout; the URL is a single argv element (quoted
  // for cmd's start quirk) so query-string & characters are never parsed.
  const platform = process.platform;
  if (platform === "win32") {
    spawn("cmd", ["/c", "start", '""', `"${url}"`], { stdio: "ignore" }).unref();
  } else if (platform === "darwin") {
    spawn("open", [url], { stdio: "ignore" }).unref();
  } else {
    spawn("xdg-open", [url], { stdio: "ignore" }).unref();
  }
}

/** Hidden single-line prompt (no echo) for pasting a registry token. */
export function promptHidden(query: string): Promise<string> {
  return new Promise((resolve) => {
    const input = process.stdin;
    const output = process.stdout;
    output.write(query);
    let value = "";
    const wasRaw = input.isRaw;
    if (input.isTTY) {
      input.setRawMode(true);
    }
    input.resume();
    const onData = (chunk: Buffer) => {
      const char = chunk.toString("utf8");
      if (char === "\r" || char === "\n" || char === "\u0004") {
        cleanup();
        output.write("\n");
        resolve(value);
      } else if (char === "\u0003") {
        cleanup();
        output.write("\n");
        process.exit(130);
      } else if (char === "\u007f" || char === "\b") {
        value = value.slice(0, -1);
      } else if (char >= " " && char !== "\u001b") {
        value += char;
      }
    };
    const cleanup = () => {
      input.removeListener("data", onData);
      if (input.isTTY) {
        input.setRawMode(!!wasRaw);
      }
      input.pause();
    };
    input.on("data", onData);
  });
}

interface LoopbackResult {
  state: string;
  token?: string;
  error?: string;
}

/** Wait for the browser's single loopback callback, then shut down. */
function waitForCallback(state: string): Promise<LoopbackResult> {
  return new Promise((resolve, reject) => {
    const server = createServer((request, response) => {
      const url = new URL(request.url ?? "/", "http://127.0.0.1");
      const body =
        "<!doctype html><html><body><p>Signed in with Arche — you can close this window and return to the terminal.</p></body></html>";
      response.writeHead(200, { "content-type": "text/html" });
      response.end(body);
      server.close();
      resolve({
        state: url.searchParams.get("state") ?? "",
        token: url.searchParams.get("token") ?? undefined,
        error: url.searchParams.get("error") ?? undefined,
      });
    });
    server.on("error", (error) => {
      reject(error instanceof Error ? error : new Error(String(error)));
    });
    const timer = setTimeout(() => {
      server.close();
      reject(new Error("timed out waiting for the browser"));
    }, CALLBACK_TIMEOUT_MS);
    timer.unref?.();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address && typeof address === "object") {
        pendingPort = address.port;
        flushListener();
      }
    });
  });
}

let pendingPort = 0;
let flushListener: () => void = () => {};

async function storeVerifiedToken(appUrl: string, token: string): Promise<string> {
  const verified = await verifyToken(appUrl, token);
  if (!verified.ok) {
    if (verified.kind === "unauthorized") {
      throw new Error("the token was rejected by the app — nothing was stored.");
    }
    throw new Error(`${verified.message} — nothing was stored.`);
  }
  saveConfig({ appUrl, username: verified.username, token });
  return verified.username;
}

/** Browser loopback login (Brief #4 §5). Never prints the token. */
export async function loginBrowser(appUrl: string): Promise<number> {
  const state = randomBytes(16).toString("hex");
  let resolvePort: (port: number) => void = () => {};
  const portPromise = new Promise<number>((resolve) => {
    resolvePort = resolve;
  });
  flushListener = () => resolvePort(pendingPort);
  const callbackPromise = waitForCallback(state);
  const port = await portPromise;
  const callback = `http://127.0.0.1:${port}/callback`;
  const authUrl =
    `${appUrl}/cli/auth?callback=${encodeURIComponent(callback)}` + `&state=${encodeURIComponent(state)}`;
  openBrowser(authUrl);
  console.log(`Opening your browser to sign in. If nothing opens, visit:\n${authUrl}`);
  let result: LoopbackResult;
  try {
    result = await callbackPromise;
  } catch {
    console.error("arche login: the browser never completed sign-in (timed out) — nothing was stored.");
    return 1;
  }
  if (result.error) {
    console.error("arche login: authorization was denied in the browser — nothing was stored.");
    return 1;
  }
  if (!result.token || result.state !== state) {
    console.error("arche login: the sign-in response was invalid — nothing was stored.");
    return 1;
  }
  try {
    const username = await storeVerifiedToken(appUrl, result.token);
    console.log(`Signed in as ${username} (${appUrl})`);
    return 0;
  } catch (error) {
    console.error(`arche login: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

/** Headless login: paste the registry token from dashboard settings. */
export async function loginWithToken(appUrl: string): Promise<number> {
  const existing = loadConfig();
  const fallback = existing?.appUrl ?? appUrl;
  const token = (await promptHidden(`Paste your registry token (from ${fallback}/dashboard/settings): `)).trim();
  if (!token) {
    console.error("arche login: no token entered — nothing was stored.");
    return 1;
  }
  try {
    const username = await storeVerifiedToken(resolveAppUrl(appUrl), token);
    console.log(`Signed in as ${username} (${resolveAppUrl(appUrl)})`);
    return 0;
  } catch (error) {
    console.error(`arche login: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

/** CI login: token from the ARCHE_TOKEN environment variable. */
export async function loginWithTokenEnv(appUrl: string): Promise<number> {
  const token = (process.env.ARCHE_TOKEN ?? "").trim();
  if (!token) {
    console.error("arche login: ARCHE_TOKEN is not set — nothing was stored.");
    return 1;
  }
  try {
    const username = await storeVerifiedToken(resolveAppUrl(appUrl), token);
    console.log(`Signed in as ${username} (${resolveAppUrl(appUrl)})`);
    return 0;
  } catch (error) {
    console.error(`arche login: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

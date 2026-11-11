import puppeteer from "puppeteer-core";

export const ASSETS_BUCKET = "identity-assets";

export interface CapturedAssets {
  sinkLight: string;
  sinkDark: string;
  og: string;
}

export interface CaptureOutcome {
  ok: boolean;
  assets: CapturedAssets | null;
  /** Which mechanism produced the captures — reported, never faked. */
  mechanism: string;
}

function chromeCandidates(): string[] {
  const fromEnv = process.env.CHROME_EXECUTABLE_PATH;
  const list = [
    fromEnv,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].filter((p): p is string => typeof p === "string" && p.length > 0);
  return [...new Set(list)];
}

function appBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  const port = process.env.PORT ?? "3000";
  return `http://localhost:${port}`;
}

async function ensureBucket(): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return false;
  try {
    // Create-if-missing; an existing bucket answers 409, which is fine.
    await fetch(`${url}/storage/v1/bucket`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: ASSETS_BUCKET, name: ASSETS_BUCKET, public: true }),
    });
    return true;
  } catch {
    return false;
  }
}

async function uploadPng(objectPath: string, bytes: Uint8Array): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return false;
  try {
    // Immutable per version: never overwrite (x-upsert: false).
    const res = await fetch(`${url}/storage/v1/object/${ASSETS_BUCKET}/${objectPath}`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "image/png",
        "x-upsert": "false",
      },
      body: bytes as BodyInit,
    });
    return res.ok || res.status === 409;
  } catch {
    return false;
  }
}

/**
 * Publish-time specimen assets (Part 5.1): render the identity's public page
 * (hero + enterprise demo site) in light and dark through headless Chrome
 * and store the captures as versioned, immutable assets. Republishing
 * creates new versioned assets, never overwrites. Failures degrade to
 * { ok: false } — publish itself must never fail because of captures.
 */
export async function captureVersionAssets(args: {
  libraryId: string;
  username: string;
  slug: string;
  version: number;
}): Promise<CaptureOutcome> {
  const { libraryId, username, slug, version } = args;
  const base = appBaseUrl();
  const pageUrl = `${base}/p/${username}/${slug}/`;
  const prefix = `${libraryId}/v${version}`;

  let executablePath: string | null = null;
  for (const candidate of chromeCandidates()) {
    try {
      const { existsSync } = await import("node:fs");
      if (existsSync(candidate)) {
        executablePath = candidate;
        break;
      }
    } catch {
      // keep looking
    }
  }
  if (!executablePath) {
    return { ok: false, assets: null, mechanism: "skipped: no headless browser available" };
  }

  let browser = null;
  try {
    browser = await puppeteer.launch({
      executablePath,
      args: ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
    });
    const page = await browser.newPage();

    // Light: full public page (hero + demo site).
    await page.goto(pageUrl, { waitUntil: "networkidle2", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 1500));
    const light = (await page.screenshot({ fullPage: true, type: "png" })) as Uint8Array;

    // Dark: same render path with the dark class applied.
    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await new Promise((r) => setTimeout(r, 800));
    const dark = (await page.screenshot({ fullPage: true, type: "png" })) as Uint8Array;

    // OG: 1200x630 hero crop (real render, identity name + install block).
    await page.evaluate(() => {
      document.documentElement.classList.remove("dark");
      window.scrollTo(0, 0);
    });
    await page.setViewport({ width: 1200, height: 630 });
    await new Promise((r) => setTimeout(r, 800));
    const og = (await page.screenshot({ type: "png" })) as Uint8Array;

    await browser.close();
    browser = null;

    const bucketReady = await ensureBucket();
    if (!bucketReady) {
      return { ok: false, assets: null, mechanism: "skipped: storage unavailable" };
    }
    const uploads = await Promise.all([
      uploadPng(`${prefix}/sink-light.png`, light),
      uploadPng(`${prefix}/sink-dark.png`, dark),
      uploadPng(`${prefix}/og.png`, og),
    ]);
    if (!uploads.every(Boolean)) {
      return { ok: false, assets: null, mechanism: "headless-chrome capture ok, storage upload failed" };
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const publicBase = `${supabaseUrl}/storage/v1/object/public/${ASSETS_BUCKET}/${prefix}`;
    return {
      ok: true,
      assets: {
        sinkLight: `${publicBase}/sink-light.png`,
        sinkDark: `${publicBase}/sink-dark.png`,
        og: `${publicBase}/og.png`,
      },
      mechanism: `headless-chrome full-page render of ${pageUrl} (light + dark) + 1200x630 hero`,
    };
  } catch (err) {
    try {
      await browser?.close();
    } catch {
      // ignore
    }
    return {
      ok: false,
      assets: null,
      mechanism: `skipped: capture failed (${err instanceof Error ? err.message : String(err)})`,
    };
  }
}


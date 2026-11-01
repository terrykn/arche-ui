import { lookupItem } from "@/lib/serve-library";

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ username: string; library: string; version: string; file: string }>;
  },
) {
  const { username, library, version, file } = await params;
  const pinned = Number(version);
  if (!Number.isInteger(pinned) || pinned < 1) {
    return new Response("Not found", { status: 404 });
  }
  const result = await lookupItem(
    username,
    library,
    file,
    pinned,
    request.headers.get("authorization"),
  );
  if (result.status === 404) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(result.json, {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

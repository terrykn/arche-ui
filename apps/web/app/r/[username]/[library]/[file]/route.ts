import { lookupItem } from "@/lib/serve-library";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string; library: string; file: string }> },
) {
  const { username, library, file } = await params;
  const result = await lookupItem(
    username,
    library,
    file,
    null,
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

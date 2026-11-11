import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  HERO_PROMPT_COOKIE,
  newIdentityHref,
  sanitizeHeroPrompt,
} from "@/lib/hero-prompt";

/** OAuth (and magic-link) return path: exchanges `code` for a session, then redirects. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // One-shot hero-prompt handoff: prefill the AI generate form, then clear.
      const raw = request.cookies.get(HERO_PROMPT_COOKIE)?.value;
      const prompt = raw ? sanitizeHeroPrompt(raw) : null;
      const dest = prompt && next === "/dashboard" ? newIdentityHref(prompt) : next;
      const response = NextResponse.redirect(`${origin}${dest}`);
      if (raw) response.cookies.delete(HERO_PROMPT_COOKIE);
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/?auth=error`);
}

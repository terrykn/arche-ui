"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  HERO_PROMPT_COOKIE,
  newIdentityHref,
  sanitizeHeroPrompt,
} from "@/lib/hero-prompt";

/** One-shot handoff: read the saved hero prompt and delete the cookie. */
async function consumeHeroPrompt(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(HERO_PROMPT_COOKIE)?.value;
  if (!raw) return null;
  store.delete(HERO_PROMPT_COOKIE);
  return sanitizeHeroPrompt(raw);
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    redirect(`/sign-up?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/", "layout");
  const prompt = await consumeHeroPrompt();
  redirect(prompt ? newIdentityHref(prompt) : "/dashboard");
}

function safeNext(raw: string): string {
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? "/dashboard"));
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/sign-in?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }
  revalidatePath("/", "layout");
  const prompt = await consumeHeroPrompt();
  redirect(next === "/dashboard" && prompt ? newIdentityHref(prompt) : next);
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "localhost:3000";
  const proto =
    headersList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const redirectTo = `${proto}://${host}/auth/callback?next=/dashboard`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  if (error || !data.url) {
    redirect(`/sign-in?error=${encodeURIComponent(error?.message ?? "Could not start Google sign-in")}`);
  }
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

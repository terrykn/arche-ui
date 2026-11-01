import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Session-aware client for server components, actions, and route handlers. */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component where set is not allowed;
            // middleware refreshes the session in that case.
          }
        },
      },
    },
  );
}

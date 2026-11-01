"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignInModal({
  open,
  onClose,
  redirectTo = "/dashboard",
}: {
  open: boolean;
  onClose: () => void;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = React.useState("john@acme.co");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setError(null);
    }
  }, [open ]);

  if (!open) {
    return null;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setPending(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    onClose();
    router.push(redirectTo);
    router.refresh();
  };

  const google = async () => {
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}` },
    });
    if (oauthError) {
      setPending(false);
      setError(oauthError.message);
    }
  };

  return (
    <div className="proto-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Sign in">
      <div className="proto-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Welcome back</h2>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>Sign in to manage your libraries.</p>
        <form onSubmit={submit}>
          <label className="proto-field">
            Email
            <input
              className="proto-input"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="proto-field">
            Password
            <input
              className="proto-input"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error ? (
            <p role="alert" style={{ color: "#e5484d", fontSize: 13.5, marginTop: 10 }}>
              {error}
            </p>
          ) : null}
          <button type="submit" className="proto-btn proto-btn-dark" style={{ width: "100%", marginTop: 18 }} disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <button
          type="button"
          className="proto-btn proto-btn-ghost"
          style={{ width: "100%", marginTop: 10 }}
          onClick={google}
          disabled={pending}
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}

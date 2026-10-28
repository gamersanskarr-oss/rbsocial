"use client";

import { useState } from "react";
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { clientAuth } from "@/lib/firebase-client";
import { createSessionFromIdToken } from "@/app/actions/auth";

// Next.js redirects thrown inside server actions carry a NEXT_REDIRECT
// digest — re-throw them so the router can navigate instead of
// swallowing them as form errors.
function isRedirectError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    typeof (err as { digest?: unknown }).digest === "string" &&
    (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export default function LoginForm() {
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    setError("");
    setNotice("");
    setPending(true);
    try {
      const cred = await signInWithEmailAndPassword(clientAuth, email, password);
      const idToken = await cred.user.getIdToken();
      const res = await createSessionFromIdToken(idToken);
      if (res?.error) setError(res.error);
    } catch (err) {
      if (isRedirectError(err)) throw err; // let Next.js redirects through
      setError("Invalid email or password.");
    } finally {
      setPending(false);
    }
  }

  async function onForgot() {
    const email = (
      document.getElementById("email") as HTMLInputElement
    )?.value.trim();
    setError("");
    setNotice("");
    if (!email) {
      setError("Enter your email above first, then tap Forgot password.");
      return;
    }
    setSendingReset(true);
    try {
      await sendPasswordResetEmail(clientAuth, email);
      // Generic message — don't reveal whether the email exists.
      setNotice(`If ${email} has an account, a reset link is on its way — check inbox & spam.`);
    } catch (err) {
      // Still show the generic message (don't leak account existence) — the
      // real Firebase error code stays in the console for debugging.
      console.error("Password reset failed:", err);
      setNotice(`If ${email} has an account, a reset link is on its way — check inbox & spam.`);
    } finally {
      setSendingReset(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <p className="banner-error">{error}</p>}
      {notice && <p className="banner-success">{notice}</p>}
      <div>
        <label htmlFor="email" className="mb-1 block text-sm text-muted">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="input"
        />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="password" className="text-sm text-muted">Password</label>
          <button
            type="button"
            onClick={onForgot}
            disabled={sendingReset}
            className="text-xs font-semibold text-muted underline-offset-2 transition hover:text-ink hover:underline disabled:opacity-50"
          >
            {sendingReset ? "Sending…" : "Forgot password?"}
          </button>
        </div>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPass ? "text" : "password"}
            required
            autoComplete="current-password"
            className="input pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPass((s) => !s)}
            aria-label={showPass ? "Hide password" : "Show password"}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-faint transition hover:text-ink"
          >
            {showPass ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                <path d="m1 1 22 22" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}

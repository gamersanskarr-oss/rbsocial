"use server";

import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase-admin";
import { getUser } from "@/lib/data";
import { createSession, destroySession, roleHome } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// Called by the login form AFTER the client SDK has signed the user in.
// Verifies the ID token, sets the session cookie and redirects home.
export async function createSessionFromIdToken(
  idToken: string
): Promise<{ error?: string }> {
  // Brute-force brake on the public session-minting endpoint.
  if (!rateLimit(`login:${await clientIp()}`, 20, 10 * 60 * 1000)) {
    return { error: "Too many sign-in attempts — try again in a few minutes." };
  }
  const decoded = await adminAuth.verifyIdToken(idToken).catch(() => null);
  if (!decoded) return { error: "Could not verify your sign-in. Try again." };

  const user = await getUser(decoded.uid);
  if (!user) {
    return { error: "This account has no workspace profile. Ask your admin." };
  }

  await createSession(idToken);
  redirect(roleHome(user.role));
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

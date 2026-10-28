import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "./firebase-admin";
import { getUser } from "./data";

const COOKIE_NAME = "session";
const SESSION_EXPIRES_IN = 5 * 24 * 60 * 60 * 1000; // 5 days (max 14)

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  team: string | null;
  missedDeadlines: number;
};

// Exchange a Firebase ID token (from client sign-in) for a long-lived
// session cookie.
export async function createSession(idToken: string) {
  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_EXPIRES_IN,
  });
  const store = await cookies();
  store.set(COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_EXPIRES_IN / 1000,
  });
}

export async function destroySession() {
  const store = await cookies();
  const cookie = store.get(COOKIE_NAME)?.value;
  if (cookie) {
    sessionCache().delete(cookie);
    // Revoke the user's tokens server-side too — with checkRevoked enabled in
    // verifySessionCookie, this kills the session everywhere, not just here.
    try {
      const decoded = await adminAuth.verifySessionCookie(cookie);
      await adminAuth.revokeRefreshTokens(decoded.uid);
    } catch {
      // Cookie already invalid/expired — nothing to revoke.
    }
  }
  store.delete(COOKIE_NAME);
}

// verifySessionCookie is a network call on every request — cache the resolved
// user briefly to keep page loads snappy. 60s TTL: role/profile edits show up
// within a minute.
type Cached = { user: SessionUser; exp: number };
const globalForAuth = globalThis as unknown as { sessionCache?: Map<string, Cached> };
const sessionCache = () => (globalForAuth.sessionCache ??= new Map<string, Cached>());

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const cookie = store.get(COOKIE_NAME)?.value;
  if (!cookie) return null;

  const cached = sessionCache().get(cookie);
  if (cached && cached.exp > Date.now()) return cached.user;

  // try/catch (not .catch) — the lazy Admin init can throw synchronously
  // when credentials are missing/malformed, before a promise exists.
  try {
    const decoded = await adminAuth.verifySessionCookie(cookie, true);
    const user = await getUser(decoded.uid);
    if (!user) return null;

    const sessionUser: SessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      team: user.team,
      missedDeadlines: user.missedDeadlines,
    };
    sessionCache().set(cookie, { user: sessionUser, exp: Date.now() + 60_000 });
    return sessionUser;
  } catch {
    return null;
  }
}

export function roleHome(role: string) {
  if (role === "ADMIN") return "/admin";
  if (role === "MANAGER") return "/manager";
  if (role === "ACCOUNTANT") return "/admin/payments";
  return "/dashboard";
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect(roleHome(user.role));
  return user;
}

export async function requireEmployee(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "EMPLOYEE") redirect(roleHome(user.role));
  return user;
}

export async function requireManager(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "MANAGER") redirect(roleHome(user.role));
  return user;
}

// Actions shared by the admin and social-media-manager workspaces
export async function requireAdminOrManager(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "MANAGER") redirect(roleHome(user.role));
  return user;
}

// Finance workspace guard: OWNER (admin) + ACCOUNTANT
export async function requireAdminOrAccountant(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "ACCOUNTANT") redirect(roleHome(user.role));
  return user;
}

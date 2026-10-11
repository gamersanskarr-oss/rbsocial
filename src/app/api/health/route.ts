// Diagnostics endpoint — reports whether Firebase Admin credentials are
// present and functional, without exposing any secret values.
import { adminAuth } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const result: Record<string, unknown> = {
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "unknown",
    node: process.version,
    envPresent: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT?.trim()),
    envLooksLikeJson: process.env.FIREBASE_SERVICE_ACCOUNT?.trim().startsWith("{") ?? false,
  };

  try {
    const users = await adminAuth.listUsers(1);
    result.adminSdk = "ok";
    result.canListUsers = users.users.length > 0;
  } catch (err) {
    result.adminSdk = "error";
    result.error = (err instanceof Error ? err.message : String(err)).slice(0, 400);
  }

  return Response.json(result);
}

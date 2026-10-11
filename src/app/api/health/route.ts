// Diagnostics endpoint — dynamically imports the admin SDK inside
// try/catch so a module-load crash surfaces as JSON instead of a 500.
export const dynamic = "force-dynamic";

export async function GET() {
  const result: Record<string, unknown> = {
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "unknown",
    node: process.version,
    envPresent: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT?.trim()),
    envLooksLikeJson: process.env.FIREBASE_SERVICE_ACCOUNT?.trim().startsWith("{") ?? false,
  };

  try {
    const { adminAuth } = await import("@/lib/firebase-admin");
    result.import = "ok";
    const users = await adminAuth.listUsers(1);
    result.adminSdk = "ok";
    result.canListUsers = users.users.length > 0;
  } catch (err) {
    result.adminSdk = "error";
    result.error = err instanceof Error ? `${err.message}` : String(err);
    result.stack = err instanceof Error ? err.stack?.slice(0, 1200) : undefined;
  }

  return Response.json(result);
}

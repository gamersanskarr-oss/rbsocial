// Diagnostics endpoint — no app imports at all. If this 500s, the
// serverless function bundle itself is broken (not app code).
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    ok: true,
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "unknown",
    node: process.version,
    envPresent: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT?.trim()),
  });
}

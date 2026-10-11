// Firebase Admin SDK — used by server components, server actions and scripts.
// Credentials come from env vars (see .env): either FIREBASE_SERVICE_ACCOUNT
// (the service-account JSON, raw or base64) or the FIREBASE_PROJECT_ID /
// FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY triple.
import { readFileSync } from "fs";
import path from "path";
import { cert, getApps, initializeApp, type App, type ServiceAccount } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function serviceAccount(): ServiceAccount {
  // 1) FIREBASE_SERVICE_ACCOUNT env var (JSON on one line, or base64)
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (raw) {
    const json = raw.startsWith("{")
      ? raw
      : raw.startsWith('"')
        ? JSON.parse(raw) // value pasted with surrounding quotes
        : Buffer.from(raw, "base64").toString("utf8");
    try {
      return JSON.parse(json) as ServiceAccount;
    } catch {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT is set but is not valid service-account JSON. " +
          "Paste the whole service-account.json on one line (no surrounding quotes) or base64-encode it."
      );
    }
  }
  // 2) service-account.json dropped into the project root (gitignored)
  const file = process.env.FIREBASE_SERVICE_ACCOUNT_FILE ?? "service-account.json";
  try {
    return JSON.parse(readFileSync(path.join(process.cwd(), file), "utf8")) as ServiceAccount;
  } catch {
    // fall through to split env vars
  }
  // 3) FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin credentials are missing. Either drop service-account.json " +
        "into the project root or set FIREBASE_SERVICE_ACCOUNT in .env."
    );
  }
  return { projectId, clientEmail, privateKey };
}

// Initialized lazily so importing this module (e.g. during `next build`)
// does not require credentials — they are only needed on real requests.
function getApp(): App {
  return getApps()[0] ?? initializeApp({ credential: cert(serviceAccount()) });
}

function lazy<T extends object>(factory: () => T): T {
  return new Proxy({} as T, {
    get(_, prop) {
      const target = factory() as Record<PropertyKey, unknown>;
      const value = target[prop];
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

export const adminAuth = lazy<Auth>(() => getAuth(getApp()));
export const adminDb = lazy<Firestore>(() => getFirestore(getApp()));

import "server-only";

import { readFileSync } from "node:fs";

import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function serviceAccountFrom(value: unknown): ServiceAccount | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as Record<string, unknown>;
  const projectId = typeof record.project_id === "string" ? record.project_id : "";
  const clientEmail = typeof record.client_email === "string" ? record.client_email : "";
  const privateKey = typeof record.private_key === "string" ? record.private_key : "";
  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }
  return { projectId, clientEmail, privateKey };
}

function loadServiceAccount(): ServiceAccount | null {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (inline) {
    try {
      return serviceAccountFrom(JSON.parse(inline) as unknown);
    } catch {
      return null;
    }
  }
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim() || process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (!path) {
    return null;
  }
  try {
    return serviceAccountFrom(JSON.parse(readFileSync(path, "utf8")) as unknown);
  } catch {
    return null;
  }
}

export function firestore(): Firestore | null {
  const existing = getApps()[0];
  if (existing) {
    return getFirestore(existing);
  }
  const account = loadServiceAccount();
  if (!account) {
    return null;
  }
  const app = initializeApp({ credential: cert(account) });
  return getFirestore(app);
}

// src/lib/auth/getIdToken.ts
import { getAuth } from "firebase/auth";

/**
 * Ambil Firebase ID token tanpa menyimpan ke localStorage.
 * Token akan diambil dari currentUser in-memory Firebase Auth.
 */
export async function getFirebaseIdToken(forceRefresh = false): Promise<string | null> {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken(forceRefresh);
}
// src/lib/auth/AuthProvider.tsx
import React, { createContext, useEffect, useMemo, useState } from "react";
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  getIdToken,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../firebase";

type AuthContextValue = {
  user: User | null;
  loading: boolean;

  login: (email: string, password: string) => Promise<void>;
  signup: (payload: { name?: string; email: string; password: string }) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;

  loginWithGoogle: () => Promise<void>;

  // Token on-demand (tidak disimpan di localStorage)
  getAccessToken: (forceRefresh?: boolean) => Promise<string | null>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signup(payload: { name?: string; email: string; password: string }) {
    const cred = await createUserWithEmailAndPassword(auth, payload.email, payload.password);
    if (payload.name?.trim()) {
      await updateProfile(cred.user, { displayName: payload.name.trim() });
    }
  }

  async function loginWithGoogle() {
    await signInWithPopup(auth, googleProvider);
  }

  async function forgotPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  }

  async function logout() {
    await signOut(auth);
  }

  async function getAccessToken(forceRefresh?: boolean) {
    if (!auth.currentUser) return null;
    return await getIdToken(auth.currentUser, !!forceRefresh);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login,
      signup,
      forgotPassword,
      logout,
      loginWithGoogle,
      getAccessToken,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
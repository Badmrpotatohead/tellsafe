// ============================================================
// TellSafe — Auth Context Provider
// ============================================================
// Wraps the app with Firebase auth state.
// Provides: user, org, loading, login, signup, logout

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { getMyOrganizations } from "../lib/data";
import type { Organization } from "../types";

interface AuthContextType {
  user: User | null;
  org: Organization | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  setOrg: (org: Organization | null) => void;
  refreshOrg: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Load the user's org
        try {
          const orgs = await getMyOrganizations();
          if (orgs.length > 0) {
            setOrg(orgs[0]); // Default to first org
          }
        } catch (err) {
          console.error("Failed to load orgs:", err);
        }
      } else {
        setOrg(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      const message =
        err.code === "auth/invalid-credential"
          ? "Invalid email or password."
          : err.code === "auth/too-many-requests"
          ? "Too many attempts. Please try again later."
          : "Something went wrong. Please try again.";
      setError(message);
      throw new Error(message);
    }
  };

  const signup = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    setError(null);

    // Client-side password strength check
    if (password.length < 8) {
      const msg = "Password must be at least 8 characters.";
      setError(msg);
      throw new Error(msg);
    }
    if (!/[A-Z]/.test(password)) {
      const msg = "Password must include an uppercase letter.";
      setError(msg);
      throw new Error(msg);
    }
    if (!/[a-z]/.test(password)) {
      const msg = "Password must include a lowercase letter.";
      setError(msg);
      throw new Error(msg);
    }
    if (!/[0-9]/.test(password)) {
      const msg = "Password must include a number.";
      setError(msg);
      throw new Error(msg);
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });

      // Send email verification
      const { sendEmailVerification } = await import("firebase/auth");
      await sendEmailVerification(cred.user);
    } catch (err: any) {
      const message =
        err.code === "auth/email-already-in-use"
          ? "An account with this email already exists."
          : err.code === "auth/weak-password"
          ? "Password must be at least 6 characters."
          : "Something went wrong. Please try again.";
      setError(message);
      throw new Error(message);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setOrg(null);
  };

  const refreshOrg = async () => {
    if (!user) return;
    const orgs = await getMyOrganizations();
    if (orgs.length > 0) setOrg(orgs[0]);
  };

  return (
    <AuthContext.Provider
      value={{ user, org, loading, error, login, signup, logout, setOrg, refreshOrg }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

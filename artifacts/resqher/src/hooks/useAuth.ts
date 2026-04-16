import { useState, useEffect } from "react";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async (): Promise<boolean> => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      return true;
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/configuration-not-found") {
        setError("Google sign-in is not enabled. Please enable it in Firebase Console → Authentication → Sign-in method → Google.");
      } else if (code === "auth/popup-blocked") {
        setError("Popup was blocked by your browser. Please allow popups for this site and try again.");
      } else {
        setError(err instanceof Error ? err.message : "Google sign-in failed");
      }
      return false;
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/configuration-not-found" || code === "auth/operation-not-allowed") {
        setError("Email/Password sign-in is not enabled. Please enable it in Firebase Console → Authentication → Sign-in method → Email/Password.");
      } else if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setError("Invalid email or password. Please check your credentials.");
      } else {
        setError(err instanceof Error ? err.message : "Sign-in failed");
      }
      return false;
    }
  };

  const registerWithEmail = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      return true;
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/configuration-not-found" || code === "auth/operation-not-allowed") {
        setError("Email/Password sign-in is not enabled. Please enable it in Firebase Console → Authentication → Sign-in method → Email/Password.");
      } else if (code === "auth/email-already-in-use") {
        setError("An account with this email already exists. Try logging in instead.");
      } else if (code === "auth/weak-password") {
        setError("Password must be at least 6 characters.");
      } else {
        setError(err instanceof Error ? err.message : "Registration failed");
      }
      return false;
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    signOut,
  };
}

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import type { User } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, role?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsub;
  }, []);

  async function signUp(email: string, password: string, role: string = "member") {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    if (role === "owner") {
      // Create a placeholder user doc for owner (club doc created in onboarding)
      await setDoc(doc(db, "users", uid), {
        email,
        role: "owner",
        createdAt: serverTimestamp(),
      });
    } else {
      // Member default setup
      const referralCode = uid.slice(0, 8).toUpperCase();
      await setDoc(doc(db, "users", uid), {
        email,
        role: "member",
        displayName: "",
        username: "",
        photoURL: "",
        points: 100,
        tier: "Access",
        subscription: "free",
        referralCode,
        birthday: "",
        createdAt: serverTimestamp(),
      });

      // Welcome bonus activity
      await setDoc(doc(db, "users", uid, "activity", "welcome"), {
        type: "welcome",
        points: 100,
        description: "Welcome to Noctu! 🎉 +100 pts",
        createdAt: serverTimestamp(),
      });
    }
  }

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

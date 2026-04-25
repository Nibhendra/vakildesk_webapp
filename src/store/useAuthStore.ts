import { create } from 'zustand';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  initAuth: () => () => void; // returns unsubscribe
}

const isFirebaseConfigured = !!(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID
);

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,
  initialized: !isFirebaseConfigured, // if not configured, skip auth gate

  initAuth: () => {
    if (!isFirebaseConfigured) {
      set({ initialized: true });
      return () => {};
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      set({ user, initialized: true });
    });
    return unsubscribe;
  },

  signInWithGoogle: async () => {
    if (!isFirebaseConfigured) return;
    set({ loading: true, error: null });
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Sign-in failed.' });
    } finally {
      set({ loading: false });
    }
  },

  signOutUser: async () => {
    if (!isFirebaseConfigured) return;
    await signOut(auth);
    set({ user: null });
  },
}));

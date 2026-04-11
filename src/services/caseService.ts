import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Case } from '../types';

const COLLECTION_NAME = 'cases';
const HARDCODED_USER_ID = 'guest_advocate';

export const caseService = {
  async getCases(): Promise<Case[]> {
    if (!import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY.includes('your_')) {
      throw new Error("Firebase API Key is missing or invalid. Please configure your .env file with real keys.");
    }

    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', HARDCODED_USER_ID)
    );
    
    // Add a 5 second timeout to prevent infinite suspension if Firebase config is invalid
    const snapshot = await Promise.race([
      getDocs(q),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout: Could not connect to Firebase Firestore. Please check your config keys and internet connection.")), 5000))
    ]);

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Case));
  },

  async addCase(caseData: Omit<Case, 'id' | 'userId'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...caseData,
      userId: HARDCODED_USER_ID,
    });
    return docRef.id;
  },

  async updateCase(id: string, caseData: Partial<Case>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, caseData);
  },

  async deleteCase(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
};

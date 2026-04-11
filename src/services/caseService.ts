import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Case } from '../types';

const COLLECTION_NAME = 'cases';
const HARDCODED_USER_ID = 'guest_advocate';

export const caseService = {
  async getCases(): Promise<Case[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', HARDCODED_USER_ID)
    );
    const snapshot = await getDocs(q);
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

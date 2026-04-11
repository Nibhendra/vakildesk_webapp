import { create } from 'zustand';
import type { Case } from '../types';
import { caseService } from '../services/caseService';

interface CaseState {
  cases: Case[];
  loading: boolean;
  error: string | null;
  fetchCases: () => Promise<void>;
  addCase: (caseData: Omit<Case, 'id' | 'userId'>) => Promise<void>;
  updateCase: (id: string, caseData: Partial<Case>) => Promise<void>;
  deleteCase: (id: string) => Promise<void>;
}

export const useCaseStore = create<CaseState>((set) => ({
  cases: [],
  loading: false,
  error: null,

  fetchCases: async () => {
    set({ loading: true, error: null });
    try {
      const data = await caseService.getCases();
      set({ cases: data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error), loading: false });
    }
  },

  addCase: async (caseData) => {
    set({ loading: true, error: null });
    try {
      const id = await caseService.addCase(caseData);
      set((state) => ({
        cases: [...state.cases, { ...caseData, id, userId: "guest_advocate" }],
        loading: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error), loading: false });
    }
  },

  updateCase: async (id, caseData) => {
    set({ loading: true, error: null });
    try {
      await caseService.updateCase(id, caseData);
      set((state) => ({
        cases: state.cases.map(c => c.id === id ? { ...c, ...caseData } : c),
        loading: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error), loading: false });
    }
  },

  deleteCase: async (id) => {
    set({ loading: true, error: null });
    try {
      await caseService.deleteCase(id);
      set((state) => ({
        cases: state.cases.filter(c => c.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error), loading: false });
    }
  }
}));

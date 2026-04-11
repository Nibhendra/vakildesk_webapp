import type { Case } from '../types';

// In-memory store — no Firebase needed
let localCases: Case[] = [
  {
    id: '1',
    userId: 'guest_advocate',
    title: 'Sharma vs State of UP',
    caseNumber: 'CNR UP-123/2024',
    court: 'High Court',
    nextHearingDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // tomorrow (urgent)
    totalFees: 50000,
    feesPaid: 20000,
    status: 'active',
  },
  {
    id: '2',
    userId: 'guest_advocate',
    title: 'Mehta & Sons vs Union of India',
    caseNumber: 'CNR DL-456/2024',
    court: 'Supreme Court',
    nextHearingDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    totalFees: 150000,
    feesPaid: 75000,
    status: 'active',
  },
  {
    id: '3',
    userId: 'guest_advocate',
    title: 'Verma vs Gupta',
    caseNumber: 'Case No. 78/2025',
    court: 'District Court',
    nextHearingDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    totalFees: 25000,
    feesPaid: 25000,
    status: 'active',
  },
  {
    id: '4',
    userId: 'guest_advocate',
    title: 'Patel Industries vs Revenue Dept',
    caseNumber: 'CNR GJ-789/2023',
    court: 'High Court',
    nextHearingDate: new Date(Date.now() + 40 * 60 * 60 * 1000).toISOString().split('T')[0], // ~40 hrs (urgent)
    totalFees: 80000,
    feesPaid: 30000,
    status: 'active',
  },
  {
    id: '5',
    userId: 'guest_advocate',
    title: 'Singh versus State',
    caseNumber: 'CNR PB-321/2025',
    court: 'District Court',
    nextHearingDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    totalFees: 35000,
    feesPaid: 10000,
    status: 'active',
  },
];

let nextId = 6;

export const caseService = {
  async getCases(): Promise<Case[]> {
    // Simulate a brief load
    return new Promise(resolve => setTimeout(() => resolve([...localCases]), 300));
  },

  async addCase(caseData: Omit<Case, 'id' | 'userId'>): Promise<string> {
    const id = String(nextId++);
    const newCase: Case = { ...caseData, id, userId: 'guest_advocate' };
    localCases = [...localCases, newCase];
    return id;
  },

  async updateCase(id: string, caseData: Partial<Case>): Promise<void> {
    localCases = localCases.map(c => c.id === id ? { ...c, ...caseData } : c);
  },

  async deleteCase(id: string): Promise<void> {
    localCases = localCases.filter(c => c.id !== id);
  },
};

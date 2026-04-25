export interface CaseNote {
  id: string;
  text: string;
  createdAt: string;
}

export interface Case {
  id?: string;
  userId: string;
  title: string;
  caseNumber: string;
  court: string;
  nextHearingDate: string;
  totalFees: number;
  feesPaid: number;
  status: "active" | "closed";
  aiSummary?: string;
  clientName?: string;
  clientPhone?: string;
}

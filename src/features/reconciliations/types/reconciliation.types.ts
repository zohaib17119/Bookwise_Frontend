export interface Reconciliation {
  id: string;
  bankAccountId: string;
  bankAccountName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  statementEndingBalance?: number | null;
  clearedBalance?: number | null;
  difference?: number | null;
  status?: string | null;
  candidateTransactions?: ReconciliationCandidateTransaction[];
}

export interface ReconciliationCandidateTransaction {
  id: string;
  transactionDate?: string | null;
  description?: string | null;
  amount: number;
  isCleared?: boolean;
}

export interface ReconciliationPayload {
  bankAccountId: string;
  startDate?: string;
  endDate?: string;
  statementEndingBalance: number;
}

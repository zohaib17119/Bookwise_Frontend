import type { BaseEntityListParams } from "@/features/shared/types/common";

export interface BankAccount {
  id: string;
  linkedAccountId: string;
  linkedAccountName?: string | null;
  name: string;
  accountNumberMasked?: string | null;
  bankName?: string | null;
  branchName?: string | null;
  currencyCode?: string | null;
  openingBalance?: number | null;
  openingBalanceDate?: string | null;
  isPrimary?: boolean;
  isActive: boolean;
}

export interface BankAccountPayload {
  linkedAccountId: string;
  name: string;
  accountNumberMasked?: string;
  bankName?: string;
  branchName?: string;
  currencyCode?: string;
  openingBalance?: number | null;
  openingBalanceDate?: string;
  isPrimary?: boolean;
  isActive: boolean;
}

export interface BankTransaction {
  id: string;
  bankAccountId: string;
  bankAccountName?: string | null;
  transactionDate?: string | null;
  description?: string | null;
  amount: number;
  type?: string | null;
  direction?: string | null;
  source?: string | null;
  sourceId?: string | null;
  isMatched?: boolean;
  isCleared?: boolean;
}

export interface BankTransactionPayload {
  bankAccountId: string;
  transactionDate?: string;
  description?: string;
  amount: number;
  type?: string;
  direction?: string;
  source?: string;
}

export interface BankTransactionListParams extends BaseEntityListParams {
  bankAccountId?: string;
  fromDate?: string;
  toDate?: string;
  isMatched?: boolean;
  isCleared?: boolean;
  type?: string;
  direction?: string;
  source?: string;
}

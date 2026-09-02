import type { BaseEntityListParams } from "@/features/shared/types/common";

export interface Expense {
  id: string;
  companyId: string;
  paymentDate: string;
  paymentAccountId: string;
  expenseAccountId: string;
  vendorId?: string | null;
  amount: string;
  amountBase: string;
  currencyCode: string;
  exchangeRate?: string | null;
  description: string;
  referenceNumber?: string | null;
  taxRateId?: string | null;
  taxAmount: string;
  taxAmountBase: string;
  lastUpdateNote?: string | null;
  vendorName?: string | null;
  paymentAccountName?: string | null;
  expenseAccountName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseListParams extends BaseEntityListParams {
  vendorId?: string;
  fromDate?: string;
  toDate?: string;
  expenseAccountIds?: string;
}

export interface ExpensePayload {
  paymentDate?: string;
  paymentAccountId: string;
  expenseAccountId: string;
  vendorId?: string;
  amount: string;
  currencyCode?: string;
  exchangeRate?: string;
  description: string;
  referenceNumber?: string;
  taxRateId?: string;
}

export interface ExpenseUpdatePayload {
  paymentDate?: string;
  paymentAccountId?: string;
  expenseAccountId?: string;
  vendorId?: string | null;
  amount?: string;
  description?: string;
  referenceNumber?: string | null;
  updateNote?: string;
}

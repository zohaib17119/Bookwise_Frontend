import type { BaseEntityListParams } from "@/features/shared/types/common";

export type AccountType =
  | "ASSET"
  | "LIABILITY"
  | "EQUITY"
  | "INCOME"
  | "EXPENSE"
  | "COST_OF_GOODS_SOLD"
  | "BANK"
  | "ACCOUNTS_RECEIVABLE"
  | "ACCOUNTS_PAYABLE"
  | "TAX"
  | "OTHER";

export type NormalSide = "DEBIT" | "CREDIT";

export interface Account {
  id: string;
  code?: string | null;
  name: string;
  description?: string | null;
  type: AccountType;
  subtype?: string | null;
  normalSide: NormalSide;
  parentAccountId?: string | null;
  parentAccountName?: string;
  currencyCode?: string | null;
  isActive: boolean;
  isSystemGenerated?: boolean;
}

export interface AccountListParams extends BaseEntityListParams {
  type?: string;
  includeSystemGenerated?: boolean;
  asTree?: boolean;
}

export interface AccountPayload {
  code?: string;
  name: string;
  description?: string;
  type: AccountType;
  subtype?: string;
  normalSide: NormalSide;
  parentAccountId?: string | null;
  currencyCode?: string;
  isActive: boolean;
}

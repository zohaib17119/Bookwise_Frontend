export interface TaxRate {
  id: string;
  name: string;
  code?: string | null;
  ratePercent: number;
  scope?: string | null;
  isCompound?: boolean;
  isRecoverable?: boolean;
  isActive: boolean;
}

export interface TaxRatePayload {
  name: string;
  code?: string;
  ratePercent: number;
  scope?: string;
  isCompound?: boolean;
  isRecoverable?: boolean;
  isActive: boolean;
}

export interface TaxCodeRate {
  id: string;
  taxRateId: string;
  sortOrder: number;
  taxRate: TaxRate;
}

export interface TaxCode {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  calculationMode?: string | null;
  scope?: string | null;
  isDefaultSales?: boolean;
  isDefaultPurchase?: boolean;
  isExempt?: boolean;
  taxRateIds?: string[];
  rates?: TaxCodeRate[];
}

export interface TaxCodePayload {
  name: string;
  code?: string;
  description?: string;
  calculationMode?: string;
  scope?: string;
  isDefaultSales?: boolean;
  isDefaultPurchase?: boolean;
  isExempt?: boolean;
  taxRateIds?: string[];
}

export interface TaxSettings {
  salesTaxPayableAccountId?: string | null;
  purchaseTaxRecoverableAccountId?: string | null;
  salesTaxCarryForwardAccountId?: string | null;
  salesTaxCarryForwardMaxPercent?: string | null;
  [key: string]: unknown;
}

export interface TaxSettingsPayload {
  salesTaxPayableAccountId?: string | null;
  purchaseTaxRecoverableAccountId?: string | null;
  salesTaxCarryForwardAccountId?: string | null;
  salesTaxCarryForwardMaxPercent?: string | null;
  [key: string]: unknown;
}

export interface TaxSummaryRow {
  taxCodeId: string;
  taxCode: string;
  taxCodeName: string;
  salesTaxAmount: string;
  purchaseTaxAmount: string;
  netTaxAmount: string;
}

export interface TaxSummaryTotals {
  salesTaxAmount: string;
  purchaseTaxAmount: string;
  netTaxAmount: string;
}

export interface TaxSummaryReportResult {
  rows: TaxSummaryRow[];
  totals: TaxSummaryTotals;
  currencyCode?: string | null;
}

export interface TaxDetailRow {
  sourceModule: "INVOICE" | "BILL";
  sourceId: string;
  sourceNumber: string;
  documentDate: string;
  counterpartyName: string;
  taxCodeId: string;
  taxCode: string;
  taxCodeName: string;
  taxRate: string;
  taxableAmount: string;
  taxAmount: string;
  direction: "SALES" | "PURCHASE";
}

export interface TaxDetailReportResult {
  rows: TaxDetailRow[];
  count?: number;
  currencyCode?: string | null;
}

export interface WhtSummaryRow {
  whtType: "INCOME" | "SALES_TAX";
  whtHeldBy: "COMPANY" | "COUNTERPARTY";
  documentCount: number;
  whtAmount: string;
  whtAmountBase: string;
  whtSettledAmount: string;
  whtOutstandingAmount: string;
}

export interface WhtSummaryReportResult {
  rows: WhtSummaryRow[];
  totals: {
    whtAmountBase: string;
    whtSettledAmount: string;
    whtOutstandingAmount: string;
  };
}

export type TaxBalanceRole =
  | "VAT_PAYABLE"
  | "VAT_RECEIVABLE"
  | "SALES_TAX_WHT_PAYABLE"
  | "SALES_TAX_WHT_RECEIVABLE"
  | "INCOME_WHT_PAYABLE"
  | "INCOME_WHT_RECEIVABLE";

export interface TaxAccountBalanceDetail {
  accountId: string;
  code: string;
  name: string;
  role: TaxBalanceRole;
  side: "PAYABLE" | "RECEIVABLE";
  balance: string;
}

export interface TaxBalancesResult {
  salesTaxPayable: string;
  salesTaxReceivable: string;
  salesTaxCarryForward: string;
  salesTaxWhtPayable: string;
  salesTaxWhtReceivable: string;
  incomeWhtPayable: string;
  incomeWhtReceivable: string;
  incomeWhtClaimed: string;
  detail: TaxAccountBalanceDetail[];
}

export type TaxPaymentDirection = "PAY" | "COLLECT";
export type TaxPaymentBucket = "VAT" | "SALES_TAX_WHT" | "INCOME_WHT";
export type TaxPaymentFundingSource = "CASH" | "CARRY_FORWARD" | "SPLIT";

export interface TaxPayment {
  id: string;
  companyId: string;
  direction: TaxPaymentDirection;
  bucket: TaxPaymentBucket;
  taxAccountId: string;
  bankAccountId?: string | null;
  fundingSource?: TaxPaymentFundingSource;
  amount: string;
  amountBase: string;
  carryForwardAmount?: string;
  cashAmount?: string;
  invoiceId?: string | null;
  billId?: string | null;
  paymentDate: string;
  memo?: string | null;
  journalEntryId?: string | null;
  createdAt: string;
}

export interface TaxPaymentPayload {
  direction: TaxPaymentDirection;
  bucket: TaxPaymentBucket;
  accountId?: string;
  amount: string;
  paymentDate: string;
  bankAccountId?: string;
  fundingSource?: TaxPaymentFundingSource;
  memo?: string;
}

export interface AuthorityTaxSettleResult {
  payment: TaxPayment;
  settledAmount: string;
  carryForwardAmount?: string;
  cashAmount?: string;
  salesTaxCarryForwardMaxPercent?: string;
  action?: "PAY" | "CLAIM";
}

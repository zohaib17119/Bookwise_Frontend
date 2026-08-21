import type { BaseEntityListParams } from "@/features/shared/types/common";
import type {
  DiscountType,
  DocumentLineInput,
  DocumentTotals,
} from "@/features/shared/types/documents";

export type EstimateStatus =
  | "DRAFT"
  | "SENT"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED";

export interface EstimateLine extends DocumentLineInput {
  id?: string;
}

export interface Estimate {
  id: string;
  estimateNumber?: string | null;
  referenceNumber?: string | null;
  customerId: string;
  customerName?: string | null;
  customer?: Record<string, unknown> | null;
  company?: Record<string, unknown> | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  currencyCode?: string | null;
  exchangeRate?: string | null;
  notes?: string | null;
  terms?: string | null;
  discountType?: DiscountType | null;
  discountValue?: number | null;
  status?: EstimateStatus | null;
  whtEnabled?: boolean | null;
  whtType?: "INCOME" | "SALES_TAX" | null;
  whtRate?: string | null;
  whtBase?: "SUBTOTAL" | "TAXABLE" | "TAX_AMOUNT" | "TOTAL" | null;
  whtHeldBy?: "COMPANY" | "COUNTERPARTY" | null;
  whtAmount?: string | null;
  whtAmountBase?: string | null;
  netSettlementAmount?: string | null;
  incomeWhtEnabled?: boolean | null;
  incomeWhtRate?: string | null;
  incomeWhtBase?: "SUBTOTAL" | "TAXABLE" | "TAX_AMOUNT" | "TOTAL" | null;
  incomeWhtHeldBy?: "COMPANY" | "COUNTERPARTY" | null;
  incomeWhtAmount?: string | null;
  incomeWhtAmountBase?: string | null;
  salesTaxWhtEnabled?: boolean | null;
  salesTaxWhtRate?: string | null;
  salesTaxWhtBase?: "SUBTOTAL" | "TAXABLE" | "TAX_AMOUNT" | "TOTAL" | null;
  salesTaxWhtHeldBy?: "COMPANY" | "COUNTERPARTY" | null;
  salesTaxWhtAmount?: string | null;
  salesTaxWhtAmountBase?: string | null;
  lines: EstimateLine[];
  totals?: DocumentTotals | null;
}

export interface ConvertEstimateToInvoicePayload {
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  status?: "DRAFT" | "ISSUED";
}

export interface EstimateListParams extends BaseEntityListParams {
  status?: string;
  customerId?: string;
}

export interface EstimatePayload {
  customerId: string;
  estimateNumber?: string;
  referenceNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  currencyCode?: string;
  exchangeRate?: string;
  notes?: string;
  terms?: string;
  discountType?: DiscountType;
  discountValue?: string | number;
  whtEnabled?: boolean;
  whtType?: "INCOME" | "SALES_TAX";
  whtRate?: string;
  whtBase?: "SUBTOTAL" | "TAXABLE" | "TAX_AMOUNT" | "TOTAL";
  whtHeldBy?: "COMPANY" | "COUNTERPARTY";
  incomeWhtEnabled?: boolean;
  incomeWhtRate?: string;
  incomeWhtBase?: "SUBTOTAL" | "TAXABLE" | "TAX_AMOUNT" | "TOTAL";
  incomeWhtHeldBy?: "COMPANY" | "COUNTERPARTY";
  salesTaxWhtEnabled?: boolean;
  salesTaxWhtRate?: string;
  salesTaxWhtBase?: "SUBTOTAL" | "TAXABLE" | "TAX_AMOUNT" | "TOTAL";
  salesTaxWhtHeldBy?: "COMPANY" | "COUNTERPARTY";
  lines: EstimateLine[];
}

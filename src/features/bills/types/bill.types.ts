import type { BaseEntityListParams } from "@/features/shared/types/common";
import type {
  DiscountType,
  DocumentLineInput,
  DocumentTotals,
} from "@/features/shared/types/documents";

export type BillStatus =
  | "DRAFT"
  | "OPEN"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "VOID"
  | "CANCELLED";

export type BillGoodsStatus =
  | "NOT_APPLICABLE"
  | "NOT_RECEIVED"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED";

export type BillPaymentStatus =
  | "UNPAID"
  | "PARTIALLY_PAID"
  | "PAID"
  | "DRAFT"
  | "VOID"
  | "CANCELLED";

export interface BillLine extends DocumentLineInput {
  id?: string;
  quantityReceived?: string | null;
  item?: {
    id: string;
    name: string;
    type?: string | null;
    trackQuantity?: boolean | null;
  } | null;
}

export interface Bill {
  id: string;
  billNumber?: string | null;
  referenceNumber?: string | null;
  vendorId: string;
  vendorName?: string | null;
  issueDate?: string | null;
  dueDate?: string | null;
  currencyCode?: string | null;
  exchangeRate?: string | null;
  notes?: string | null;
  discountType?: DiscountType | null;
  discountValue?: string | null;
  status?: BillStatus | null;
  rawStatus?: BillStatus | null;
  goodsStatus?: BillGoodsStatus | null;
  complianceStatus?:
    | "NOT_APPLICABLE"
    | "PENDING"
    | "SUBMITTED"
    | "CLEARED"
    | "REPORTED"
    | "REJECTED"
    | "ERROR"
    | null;
  paymentStatus?: BillPaymentStatus | null;
  total?: string | null;
  subtotal?: string | null;
  taxAmount?: string | null;
  taxRateDisplay?: string | null;
  amountPaid?: number | null;
  amountDue?: number | null;
  whtEnabled?: boolean | null;
  whtType?: "INCOME" | "SALES_TAX" | null;
  whtRate?: string | null;
  whtBase?: "SUBTOTAL" | "TAXABLE" | "TAX_AMOUNT" | "TOTAL" | null;
  whtHeldBy?: "COMPANY" | "COUNTERPARTY" | null;
  whtAmount?: string | null;
  whtAmountBase?: string | null;
  netSettlementAmount?: string | null;
  whtSettledAmount?: string | null;
  incomeWhtEnabled?: boolean | null;
  incomeWhtRate?: string | null;
  incomeWhtBase?: "SUBTOTAL" | "TAXABLE" | "TAX_AMOUNT" | "TOTAL" | null;
  incomeWhtHeldBy?: "COMPANY" | "COUNTERPARTY" | null;
  incomeWhtAmount?: string | null;
  incomeWhtAmountBase?: string | null;
  incomeWhtSettledAmount?: string | null;
  salesTaxAuthoritySettledAmount?: string | null;
  incomeWhtAuthoritySettledAmount?: string | null;
  salesTaxWhtEnabled?: boolean | null;
  salesTaxWhtRate?: string | null;
  salesTaxWhtBase?: "SUBTOTAL" | "TAXABLE" | "TAX_AMOUNT" | "TOTAL" | null;
  salesTaxWhtHeldBy?: "COMPANY" | "COUNTERPARTY" | null;
  salesTaxWhtAmount?: string | null;
  salesTaxWhtAmountBase?: string | null;
  salesTaxWhtSettledAmount?: string | null;
  lines: BillLine[];
  totals?: DocumentTotals | null;
}

export interface BillListParams extends BaseEntityListParams {
  status?: string;
  vendorId?: string;
}

export interface BillPayload {
  vendorId: string;
  billNumber?: string;
  referenceNumber?: string;
  issueDate?: string;
  dueDate?: string;
  currencyCode?: string;
  exchangeRate?: string;
  notes?: string;
  discountType?: DiscountType;
  discountValue?: string;
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
  lines: BillLine[];
}

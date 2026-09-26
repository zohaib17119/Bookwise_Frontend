import type { BaseEntityListParams } from "@/features/shared/types/common";
import type {
  DiscountType,
  DocumentLineInput,
  DocumentTotals,
} from "@/features/shared/types/documents";

export type InvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "VOID"
  | "CANCELLED";

export type InvoiceComplianceStatus =
  | "NOT_APPLICABLE"
  | "PENDING"
  | "SUBMITTED"
  | "CLEARED"
  | "REPORTED"
  | "REJECTED"
  | "ERROR";

export interface InvoiceLine extends DocumentLineInput {
  id?: string;
  taxCodeId?: string | null;
  taxRateId?: string | null;
  taxRate?: string | null;
  taxName?: string | null;
  lineSubtotal?: string | null;
  lineTaxAmount?: string | null;
  lineTotal?: string | null;
  fbrHsCode?: string | null;
  fbrUom?: string | null;
  fbrSaleType?: string | null;
  fbrFixedNotifiedValueOrRetailPrice?: string | null;
}

export type InvoiceDocumentType = "TAX_INVOICE" | "CREDIT_NOTE" | "DEBIT_NOTE";

export interface Invoice {
  id: string;
  invoiceNumber?: string | null;
  referenceNumber?: string | null;
  contactPersonName?: string | null;
  contactMobile?: string | null;
  contactPersonDepartment?: string | null;
  deliveryDate?: string;
  deliveryChallanNumber?: string;
  shippingAddressId?: string | null;
  shippingAddressLabel?: string | null;
  shippingAddressLine1?: string | null;
  shippingAddressLine2?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingPostalCode?: string | null;
  shippingCountry?: string | null;
  customerId: string;
  customerName?: string | null;
  estimateId?: string | null;
  estimateNumber?: string | null;
  issueDate?: string | null;
  dueDate?: string | null;
  currencyCode?: string | null;
  exchangeRate?: string | null;
  notes?: string | null;
  terms?: string | null;
  memoOnStatement?: string | null;
  paymentOptions?: string[] | null;
  discountType?: DiscountType | null;
  discountValue?: string | null;
  status?: InvoiceStatus | null;
  rawStatus?: InvoiceStatus | null;
  sourceChannel?: "ACCOUNTING" | "POS" | null;
  documentType?: InvoiceDocumentType | null;
  originalInvoiceId?: string | null;
  originalInvoice?: {
    id: string;
    invoiceNumber?: string | null;
    complianceUuid?: string | null;
  } | null;
  complianceStatus?: InvoiceComplianceStatus | null;
  complianceUuid?: string | null;
  invoiceHash?: string | null;
  qrPayload?: string | null;
  complianceLastError?: string | null;
  fbrSubmissionStatus?: string | null;
  fbrSubmittedAt?: string | null;
  fbrFbrInvoiceNumber?: string | null;
  fbrInvoiceRefNo?: string | null;
  fbrScenarioId?: string | null;
  fbrAttemptCount?: number | null;
  fbrLastError?: string | null;
  fbrLastResponseCode?: string | null;
  fbrLastRequestJson?: unknown | null;
  fbrLastResponseBody?: unknown | null;
  fbrLastHttpStatus?: number | null;
  fbrLastPostUrl?: string | null;
  fbrLastReachedGateway?: boolean | null;
  fbrFrozenSellerNTNCNIC?: string | null;
  fbrFrozenSellerBusinessName?: string | null;
  fbrFrozenSellerProvince?: string | null;
  fbrFrozenSellerAddress?: string | null;
  fbrFrozenBuyerNTNCNIC?: string | null;
  fbrFrozenBuyerBusinessName?: string | null;
  fbrFrozenBuyerProvince?: string | null;
  fbrFrozenBuyerAddress?: string | null;
  fbrFrozenBuyerRegistrationType?: string | null;
  total?: string | null;
  subtotal?: string | null;
  taxAmount?: string | null;
  taxRateDisplay?: string | null;
  amountPaid?: string | null;
  amountDue?: string | null;
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
  lines: InvoiceLine[];
  totals?: DocumentTotals | null;
}

export interface InvoiceListParams extends BaseEntityListParams {
  status?: string;
  customerId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface InvoicePayload {
  customerId: string;
  estimateId?: string;
  invoiceNumber?: string;
  referenceNumber?: string;
  contactPersonName?: string;
  contactMobile?: string;
  contactPersonDepartment?: string;
  deliveryDate?: string;
  deliveryChallanNumber?: string;
  shippingAddressId?: string | null;
  issueDate?: string;
  dueDate?: string;
  currencyCode?: string;
  exchangeRate?: string;
  notes?: string;
  terms?: string;
  memoOnStatement?: string;
  paymentOptions?: string[];
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
  lines: InvoiceLine[];
}

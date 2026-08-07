export type InvoiceTableColumnKey =
  | "product"
  | "description"
  | "qty"
  | "rate"
  | "discount"
  | "tax"
  | "total";

export type InvoiceTemplateBlockType =
  | "letterhead"
  | "logo"
  | "companyDetails"
  | "customerDetails"
  | "shippingDetails"
  | "invoiceMeta"
  | "lineTable"
  | "totals"
  | "notes"
  | "footer";

export interface InvoiceTemplateBlock {
  id: string;
  type: InvoiceTemplateBlockType;
  x: number;
  y: number;
  width: number;
  height?: number;
  visible: boolean;
}

export interface InvoiceTemplateLayout {
  version: 1;
  letterheadUrl?: string | null;
  logoUrl?: string | null;
  footerImageUrl?: string | null;
  showLogo: boolean;
  columns: InvoiceTableColumnKey[];
  blocks: InvoiceTemplateBlock[];
}

export interface InvoiceDocumentTemplate {
  id: string;
  companyId: string;
  name: string;
  isDefault: boolean;
  layoutJson: InvoiceTemplateLayout;
  compiledHtml: string;
  createdAt?: string;
  updatedAt?: string;
}

export const COLUMN_LABELS: Record<InvoiceTableColumnKey, string> = {
  product: "Product",
  description: "Description",
  qty: "Qty",
  rate: "Rate",
  discount: "Discount",
  tax: "Tax",
  total: "Total",
};

export const BLOCK_LABELS: Record<InvoiceTemplateBlockType, string> = {
  letterhead: "Letterhead",
  logo: "Logo",
  companyDetails: "Company details",
  customerDetails: "Bill To",
  shippingDetails: "Ship To",
  invoiceMeta: "Invoice meta",
  lineTable: "Line items table",
  totals: "Totals",
  notes: "Notes",
  footer: "Footer",
};

export const DEFAULT_INVOICE_TEMPLATE_LAYOUT: InvoiceTemplateLayout = {
  version: 1,
  letterheadUrl: null,
  logoUrl: null,
  footerImageUrl: null,
  showLogo: true,
  columns: ["product", "description", "qty", "rate", "discount", "tax", "total"],
  blocks: [
    { id: "letterhead", type: "letterhead", x: 0, y: 0, width: 100, height: 12, visible: false },
    { id: "logo", type: "logo", x: 72, y: 2, width: 26, height: 10, visible: true },
    { id: "companyDetails", type: "companyDetails", x: 2, y: 2, width: 48, visible: true },
    { id: "customerDetails", type: "customerDetails", x: 2, y: 16, width: 32, visible: true },
    { id: "shippingDetails", type: "shippingDetails", x: 35, y: 16, width: 32, visible: true },
    { id: "invoiceMeta", type: "invoiceMeta", x: 68, y: 16, width: 30, visible: true },
    { id: "lineTable", type: "lineTable", x: 2, y: 34, width: 96, visible: true },
    { id: "totals", type: "totals", x: 58, y: 72, width: 40, visible: true },
    { id: "notes", type: "notes", x: 2, y: 72, width: 52, visible: true },
    { id: "footer", type: "footer", x: 2, y: 90, width: 96, height: 8, visible: true },
  ],
};

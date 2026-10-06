export type InvoiceTableColumnKey =
  | "serial"
  | "product"
  | "description"
  | "qty"
  | "rate"
  | "discount"
  | "taxPercent"
  | "taxAmount"
  | "total";

export type TemplateElementKind =
  | "field"
  | "text"
  | "image"
  | "box"
  | "letterhead"
  | "logo"
  | "lineTable"
  | "totals"
  | "notes"
  | "footer"
  | "fbrDi";

export interface BuiltinInvoiceTableColumn {
  kind?: "builtin";
  key: InvoiceTableColumnKey;
  headerFormat?: string;
  cellFormat?: string;
}

export interface FormulaInvoiceTableColumn {
  kind: "formula";
  id: string;
  header: string;
  expression: string;
  numeric?: boolean;
}

export type InvoiceTableColumn = BuiltinInvoiceTableColumn | FormulaInvoiceTableColumn;

export function isFormulaColumn(column: InvoiceTableColumn): column is FormulaInvoiceTableColumn {
  return column.kind === "formula";
}

export function isBuiltinColumn(column: InvoiceTableColumn): column is BuiltinInvoiceTableColumn {
  return !isFormulaColumn(column);
}

export function columnIdentity(column: InvoiceTableColumn): string {
  return isFormulaColumn(column) ? column.id : column.key;
}

export type InvoiceFieldGroup = "invoice" | "company" | "customer" | "totals" | "special";

export interface TemplateElementStyle {
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  color?: string;
  textAlign?: "left" | "center" | "right";
  backgroundColor?: string;
  borderColor?: string;
  padding?: number;
}

/** Inner layout knobs for locked FBR DI block (number / logo / QR). */
export interface FbrDiLayoutConfig {
  invoiceFontSize?: number;
  invoiceFontWeight?: "normal" | "bold";
  invoiceColor?: string;
  invoiceTextAlign?: "left" | "center" | "right";
  invoiceMarginBottomPx?: number;
  logoWidthPx?: number;
  logoOffsetXPx?: number;
  logoOffsetYPx?: number;
  qrSizePx?: number;
  qrOffsetXPx?: number;
  qrOffsetYPx?: number;
  rowGapPx?: number;
  rowAlign?: "flex-start" | "center" | "flex-end";
}

export const DEFAULT_FBR_DI_LAYOUT: Required<FbrDiLayoutConfig> = {
  invoiceFontSize: 11,
  invoiceFontWeight: "bold",
  invoiceColor: "#0f172a",
  invoiceTextAlign: "left",
  invoiceMarginBottomPx: 6,
  logoWidthPx: 120,
  logoOffsetXPx: 0,
  logoOffsetYPx: 0,
  qrSizePx: 84,
  qrOffsetXPx: 0,
  qrOffsetYPx: 0,
  rowGapPx: 10,
  rowAlign: "flex-end",
};

export function clampFbrDiNumber(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function normalizeFbrDiLayout(raw: unknown): FbrDiLayoutConfig {
  const d = DEFAULT_FBR_DI_LAYOUT;
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const weight =
    src.invoiceFontWeight === "normal" || src.invoiceFontWeight === "bold"
      ? src.invoiceFontWeight
      : d.invoiceFontWeight;
  const align =
    src.invoiceTextAlign === "left" ||
    src.invoiceTextAlign === "center" ||
    src.invoiceTextAlign === "right"
      ? src.invoiceTextAlign
      : d.invoiceTextAlign;
  const rowAlign =
    src.rowAlign === "flex-start" || src.rowAlign === "center" || src.rowAlign === "flex-end"
      ? src.rowAlign
      : d.rowAlign;
  return {
    invoiceFontSize: clampFbrDiNumber(src.invoiceFontSize, 8, 24, d.invoiceFontSize),
    invoiceFontWeight: weight,
    invoiceColor:
      typeof src.invoiceColor === "string" && src.invoiceColor.trim()
        ? src.invoiceColor.trim().slice(0, 40)
        : d.invoiceColor,
    invoiceTextAlign: align,
    invoiceMarginBottomPx: clampFbrDiNumber(src.invoiceMarginBottomPx, 0, 40, d.invoiceMarginBottomPx),
    logoWidthPx: clampFbrDiNumber(src.logoWidthPx, 40, 200, d.logoWidthPx),
    logoOffsetXPx: clampFbrDiNumber(src.logoOffsetXPx, -40, 80, d.logoOffsetXPx),
    logoOffsetYPx: clampFbrDiNumber(src.logoOffsetYPx, -40, 80, d.logoOffsetYPx),
    qrSizePx: clampFbrDiNumber(src.qrSizePx, 48, 160, d.qrSizePx),
    qrOffsetXPx: clampFbrDiNumber(src.qrOffsetXPx, -40, 80, d.qrOffsetXPx),
    qrOffsetYPx: clampFbrDiNumber(src.qrOffsetYPx, -40, 80, d.qrOffsetYPx),
    rowGapPx: clampFbrDiNumber(src.rowGapPx, 0, 40, d.rowGapPx),
    rowAlign,
  };
}

export function mergeFbrDiLayout(partial?: FbrDiLayoutConfig | null): FbrDiLayoutConfig {
  return normalizeFbrDiLayout({ ...DEFAULT_FBR_DI_LAYOUT, ...(partial ?? {}) });
}

export type YAnchor = "pageTop" | "afterLineTable" | "pageBottom";

export interface TemplateElement {
  id: string;
  kind: TemplateElementKind;
  x: number;
  y: number;
  width: number;
  height?: number;
  maxHeight?: number;
  yAnchor?: YAnchor;
  repeatOnEveryPage?: boolean;
  visible?: boolean;
  parentId?: string | null;
  sortOrder?: number;
  binding?: string;
  titleBinding?: string | null;
  label?: string;
  showLabel?: boolean;
  content?: string;
  style?: TemplateElementStyle;
  fbrDiLayout?: FbrDiLayoutConfig;
}

export interface LineTableConfig {
  x: number;
  y: number;
  width: number;
  height?: number;
  maxHeight?: number;
  rowHeight?: number;
  visible?: boolean;
}

export interface InvoiceTemplateLayout {
  version: 2;
  letterheadUrl?: string | null;
  logoUrl?: string | null;
  footerImageUrl?: string | null;
  showLogo?: boolean;
  columns: InvoiceTableColumn[];
  lineTable?: LineTableConfig;
  elements: TemplateElement[];
}

export type DocumentTemplateKind = "INVOICE" | "ESTIMATE";

export interface InvoiceDocumentTemplate {
  id: string;
  companyId: string;
  name: string;
  kind?: DocumentTemplateKind;
  isDefault: boolean;
  layoutJson: InvoiceTemplateLayout;
  compiledHtml: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoiceFieldDefinition {
  binding: string;
  label: string;
  group: InvoiceFieldGroup;
}

export const CONTAINER_KINDS = new Set<TemplateElementKind>([
  "box",
  "lineTable",
  "letterhead",
  "logo",
  "notes",
  "footer",
  "totals",
  "fbrDi",
]);

/** Default geometry for locked FBR Digital Invoicing block (bottom-left). */
export const DEFAULT_FBR_DI_ELEMENT: TemplateElement = {
  id: "fbrDi",
  kind: "fbrDi",
  x: 2,
  y: 2,
  width: 48,
  height: 16,
  visible: true,
  yAnchor: "pageBottom",
  fbrDiLayout: { ...DEFAULT_FBR_DI_LAYOUT },
};

export function ensureFbrDiInLayout(
  layout: InvoiceTemplateLayout,
  diEnabled: boolean,
): InvoiceTemplateLayout {
  if (!diEnabled) return layout;
  const existing = layout.elements.find((el) => el.kind === "fbrDi" && !el.parentId);
  if (existing) {
    return {
      ...layout,
      elements: layout.elements.map((el) =>
        el.id === existing.id
          ? {
              ...el,
              kind: "fbrDi" as const,
              visible: true,
              yAnchor: el.yAnchor ?? "pageBottom",
              height: el.height ?? DEFAULT_FBR_DI_ELEMENT.height,
              width: el.width ?? DEFAULT_FBR_DI_ELEMENT.width,
              fbrDiLayout: mergeFbrDiLayout(el.fbrDiLayout),
            }
          : el,
      ),
    };
  }
  return {
    ...layout,
    elements: [
      ...layout.elements,
      { ...DEFAULT_FBR_DI_ELEMENT, fbrDiLayout: { ...DEFAULT_FBR_DI_LAYOUT } },
    ],
  };
}

export const INVOICE_FIELD_CATALOG: InvoiceFieldDefinition[] = [
  { binding: "invoice.number", label: "Invoice number", group: "invoice" },
  { binding: "invoice.issueDate", label: "Issue date", group: "invoice" },
  { binding: "invoice.dueDate", label: "Due date", group: "invoice" },
  { binding: "invoice.poReference", label: "PO reference", group: "invoice" },
  { binding: "invoice.deliveryDate", label: "Delivery date", group: "invoice" },
  { binding: "invoice.deliveryChallanNumber", label: "Delivery challan no", group: "invoice" },
  { binding: "invoice.notes", label: "Notes", group: "invoice" },
  { binding: "invoice.terms", label: "Terms", group: "invoice" },
  { binding: "invoice.currency", label: "Currency", group: "invoice" },
  { binding: "invoice.status", label: "Status", group: "invoice" },
  { binding: "invoice.memoOnStatement", label: "Memo on statement", group: "invoice" },
  { binding: "company.name", label: "Company name", group: "company" },
  { binding: "company.legalName", label: "Company legal name", group: "company" },
  { binding: "company.email", label: "Company email", group: "company" },
  { binding: "company.phone", label: "Company phone", group: "company" },
  { binding: "company.taxRegistrationNumber", label: "Company tax ID", group: "company" },
  { binding: "company.addressLine1", label: "Company address line 1", group: "company" },
  { binding: "company.addressLine2", label: "Company address line 2", group: "company" },
  { binding: "company.city", label: "Company city", group: "company" },
  { binding: "company.state", label: "Company state", group: "company" },
  { binding: "company.postalCode", label: "Company postal code", group: "company" },
  { binding: "company.country", label: "Company country", group: "company" },
  { binding: "customer.displayName", label: "Customer name", group: "customer" },
  { binding: "customer.legalName", label: "Customer legal name", group: "customer" },
  { binding: "customer.email", label: "Customer email", group: "customer" },
  { binding: "customer.phone", label: "Customer phone", group: "customer" },
  { binding: "customer.mobile", label: "Contact mobile", group: "customer" },
  { binding: "customer.contactPersonName", label: "Contact person", group: "customer" },
  { binding: "customer.contactPersonDepartment", label: "Department", group: "customer" },
  { binding: "customer.taxRegistrationNumber", label: "Customer VAT/NTN", group: "customer" },
  { binding: "customer.customerCode", label: "Customer code", group: "customer" },
  { binding: "customer.website", label: "Customer website", group: "customer" },
  { binding: "customer.billingAddressLine1", label: "Billing address line 1", group: "customer" },
  { binding: "customer.billingAddressLine2", label: "Billing address line 2", group: "customer" },
  { binding: "customer.billingCity", label: "Billing city", group: "customer" },
  { binding: "customer.billingState", label: "Billing state", group: "customer" },
  { binding: "customer.billingPostalCode", label: "Billing postal code", group: "customer" },
  { binding: "customer.billingCountry", label: "Billing country", group: "customer" },
  { binding: "customer.shippingAddressLabel", label: "Shipping address label", group: "customer" },
  { binding: "customer.shippingAddressLine1", label: "Shipping address line 1", group: "customer" },
  { binding: "customer.shippingAddressLine2", label: "Shipping address line 2", group: "customer" },
  { binding: "customer.shippingCity", label: "Shipping city", group: "customer" },
  { binding: "customer.shippingState", label: "Shipping state", group: "customer" },
  { binding: "customer.shippingPostalCode", label: "Shipping postal code", group: "customer" },
  { binding: "customer.shippingCountry", label: "Shipping country", group: "customer" },
  { binding: "totals.subtotal", label: "Subtotal", group: "totals" },
  { binding: "totals.taxAmount", label: "Tax amount", group: "totals" },
  { binding: "totals.total", label: "Grand total", group: "totals" },
  { binding: "totals.whtAmount", label: "WHT amount", group: "totals" },
  { binding: "totals.whtRate", label: "WHT rate", group: "totals" },
  { binding: "totals.whtType", label: "WHT type", group: "totals" },
  { binding: "totals.whtHeldBy", label: "WHT held by", group: "totals" },
  { binding: "totals.netSettlement", label: "Net settlement", group: "totals" },
];

export const FIELD_GROUP_LABELS: Record<InvoiceFieldGroup, string> = {
  invoice: "Invoice",
  company: "Company",
  customer: "Customer",
  totals: "Totals",
  special: "Special",
};

export const INVOICE_TABLE_COLUMN_KEYS: InvoiceTableColumnKey[] = [
  "serial",
  "product",
  "description",
  "qty",
  "rate",
  "discount",
  "taxPercent",
  "taxAmount",
  "total",
];

export const MAX_INVOICE_TABLE_COLUMNS = 20;

export const FORMULA_LINE_TOKENS = [
  "qty",
  "rate",
  "unitPrice",
  "lineSubtotal",
  "taxRate",
  "lineTaxAmount",
  "lineTotal",
  "taxName",
  "itemName",
  "description",
  "serial",
  "lineNumber",
] as const;

export const DEFAULT_INVOICE_TABLE_COLUMNS: InvoiceTableColumn[] = INVOICE_TABLE_COLUMN_KEYS.map(
  (key) => ({ kind: "builtin", key }),
);

export function applyColumnFormat(format: string | undefined, value: string): string {
  if (!format?.trim()) return value;
  if (format.includes("{value}")) return format.split("{value}").join(value);
  return `${format.trim()} ${value}`.trim();
}

export function applyHeaderFormat(format: string | undefined, defaultLabel: string): string {
  if (!format?.trim()) return defaultLabel;
  if (format.includes("{value}")) return format.split("{value}").join(defaultLabel);
  return format.trim();
}

export const COLUMN_LABELS: Record<InvoiceTableColumnKey, string> = {
  serial: "S.No",
  product: "Product",
  description: "Description",
  qty: "Qty",
  rate: "Rate",
  discount: "Discount",
  taxPercent: "Tax %",
  taxAmount: "Tax amount",
  total: "Total",
};

/** What each builtin column renders for the backend preview sample invoice —
 *  keep in sync with compileInvoiceTemplateShell in the backend compiler. */
export const COLUMN_SAMPLE_VALUES: Record<InvoiceTableColumnKey, string> = {
  serial: "1",
  product: "Premium Widget",
  description: "Blue finish",
  qty: "2",
  rate: "50.00",
  discount: "—",
  taxPercent: "15%",
  taxAmount: "15.00",
  total: "115.00",
};

export const KIND_LABELS: Record<TemplateElementKind, string> = {
  field: "Field line",
  text: "Text line",
  image: "Image",
  box: "Box",
  letterhead: "Letterhead",
  logo: "Logo",
  lineTable: "Line table",
  totals: "Totals block",
  notes: "Notes",
  footer: "Footer",
  fbrDi: "FBR Digital Invoice",
};

export function columnHeaderLabel(column: InvoiceTableColumn): string {
  if (isFormulaColumn(column)) return column.header;
  return applyHeaderFormat(column.headerFormat, COLUMN_LABELS[column.key]);
}

function isLegacyTaxKey(key: string): boolean {
  return key === "tax";
}

function expandLegacyTaxColumn(col: BuiltinInvoiceTableColumn): BuiltinInvoiceTableColumn[] {
  if (!isLegacyTaxKey(col.key as string)) return [col];
  return [
    { kind: "builtin", key: "taxPercent" },
    {
      kind: "builtin",
      key: "taxAmount",
      ...(col.headerFormat ? { headerFormat: col.headerFormat } : {}),
      ...(col.cellFormat ? { cellFormat: col.cellFormat } : {}),
    },
  ];
}

function pickColumnFormats(raw: Record<string, unknown>) {
  const out: Pick<BuiltinInvoiceTableColumn, "headerFormat" | "cellFormat"> = {};
  if (typeof raw.headerFormat === "string" && raw.headerFormat.trim()) {
    out.headerFormat = raw.headerFormat.trim().slice(0, 120);
  }
  if (typeof raw.cellFormat === "string" && raw.cellFormat.trim()) {
    out.cellFormat = raw.cellFormat.trim().slice(0, 120);
  }
  return out;
}

function normalizeColumn(raw: unknown): InvoiceTableColumn[] {
  if (typeof raw === "string") {
    if (isLegacyTaxKey(raw)) return expandLegacyTaxColumn({ kind: "builtin", key: "tax" as InvoiceTableColumnKey });
    if (!INVOICE_TABLE_COLUMN_KEYS.includes(raw as InvoiceTableColumnKey)) return [];
    return [{ kind: "builtin", key: raw as InvoiceTableColumnKey }];
  }
  if (!raw || typeof raw !== "object") return [];
  const rec = raw as Record<string, unknown>;
  if (rec.kind === "formula") {
    const id = typeof rec.id === "string" ? rec.id.trim().slice(0, 80) : "";
    const header = typeof rec.header === "string" ? rec.header.trim().slice(0, 120) : "";
    const expression = typeof rec.expression === "string" ? rec.expression.slice(0, 500) : "";
    if (!id || !header || !expression.trim()) return [];
    return [{
      kind: "formula",
      id,
      header,
      expression,
      ...(rec.numeric === true ? { numeric: true } : {}),
    }];
  }
  const key = rec.key;
  if (typeof key === "string" && isLegacyTaxKey(key)) {
    return expandLegacyTaxColumn({ kind: "builtin", key: "tax" as InvoiceTableColumnKey, ...pickColumnFormats(rec) });
  }
  if (typeof key !== "string" || !INVOICE_TABLE_COLUMN_KEYS.includes(key as InvoiceTableColumnKey)) {
    return [];
  }
  return [{ kind: "builtin", key: key as InvoiceTableColumnKey, ...pickColumnFormats(rec) }];
}

export function normalizeLayoutColumns(raw: unknown): InvoiceTableColumn[] {
  const fallback = [...DEFAULT_INVOICE_TABLE_COLUMNS];
  if (!Array.isArray(raw)) return fallback;
  const seenBuiltin = new Set<InvoiceTableColumnKey>();
  const seenFormula = new Set<string>();
  const columns: InvoiceTableColumn[] = [];
  for (const item of raw) {
    for (const col of normalizeColumn(item)) {
      if (isFormulaColumn(col)) {
        if (seenFormula.has(col.id)) continue;
        seenFormula.add(col.id);
        columns.push(col);
        continue;
      }
      if (seenBuiltin.has(col.key)) continue;
      seenBuiltin.add(col.key);
      columns.push(col);
    }
    if (columns.length >= MAX_INVOICE_TABLE_COLUMNS) break;
  }
  if (columns.length && !columns.some((c) => isBuiltinColumn(c) && c.key === "serial")) {
    columns.unshift({ kind: "builtin", key: "serial" });
  }
  return columns.length ? columns.slice(0, MAX_INVOICE_TABLE_COLUMNS) : fallback;
}

let elementCounter = 0;

export function newElementId(prefix = "el"): string {
  elementCounter += 1;
  return `${prefix}-${Date.now()}-${elementCounter}`;
}

export function isTopLevelElement(el: TemplateElement): boolean {
  return !el.parentId;
}

export function getTopLevelElements(elements: TemplateElement[]): TemplateElement[] {
  return elements.filter(isTopLevelElement);
}

export function getBoxChildren(elements: TemplateElement[], boxId: string): TemplateElement[] {
  return elements
    .filter((el) => el.parentId === boxId)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function nextChildSortOrder(elements: TemplateElement[], boxId: string): number {
  const children = getBoxChildren(elements, boxId);
  if (!children.length) return 0;
  return Math.max(...children.map((c) => c.sortOrder ?? 0)) + 1;
}

export function addChildToBox(
  layout: InvoiceTemplateLayout,
  boxId: string,
  child: Omit<TemplateElement, "parentId" | "sortOrder">,
): InvoiceTemplateLayout {
  const sortOrder = nextChildSortOrder(layout.elements, boxId);
  return {
    ...layout,
    elements: [
      ...layout.elements,
      {
        ...child,
        parentId: boxId,
        sortOrder,
        x: 0,
        y: 0,
        width: 100,
      },
    ],
  };
}

export function removeElementAndChildren(
  layout: InvoiceTemplateLayout,
  elementId: string,
): InvoiceTemplateLayout {
  const toRemove = new Set<string>([elementId]);
  const target = layout.elements.find((el) => el.id === elementId);
  if (target?.kind === "box") {
    layout.elements.filter((el) => el.parentId === elementId).forEach((el) => toRemove.add(el.id));
  }
  return {
    ...layout,
    elements: layout.elements.filter((el) => !toRemove.has(el.id)),
  };
}

export function reorderBoxChild(
  layout: InvoiceTemplateLayout,
  childId: string,
  direction: -1 | 1,
): InvoiceTemplateLayout {
  const child = layout.elements.find((el) => el.id === childId);
  if (!child?.parentId) return layout;
  const siblings = getBoxChildren(layout.elements, child.parentId);
  const index = siblings.findIndex((el) => el.id === childId);
  const target = index + direction;
  if (target < 0 || target >= siblings.length) return layout;
  const reordered = [...siblings];
  const [item] = reordered.splice(index, 1);
  reordered.splice(target, 0, item);
  const sortMap = new Map(reordered.map((el, idx) => [el.id, idx]));
  return {
    ...layout,
    elements: layout.elements.map((el) =>
      el.parentId === child.parentId && sortMap.has(el.id)
        ? { ...el, sortOrder: sortMap.get(el.id) }
        : el,
    ),
  };
}

function childField(
  id: string,
  parentId: string,
  sortOrder: number,
  binding: string,
  label: string,
  opts?: Partial<TemplateElement>,
): TemplateElement {
  return {
    id,
    kind: "field",
    parentId,
    sortOrder,
    binding,
    label,
    showLabel: true,
    x: 0,
    y: 0,
    width: 100,
    visible: true,
    style: { fontSize: 11, color: "#334155" },
    ...opts,
  };
}

function topField(
  id: string,
  binding: string,
  label: string,
  x: number,
  y: number,
  width: number,
  opts?: Partial<TemplateElement>,
): TemplateElement {
  return {
    id,
    kind: "field",
    binding,
    label,
    showLabel: true,
    x,
    y,
    width,
    visible: true,
    style: { fontSize: 11, color: "#334155" },
    ...opts,
  };
}

function box(
  id: string,
  content: string,
  x: number,
  y: number,
  width: number,
  height: number,
): TemplateElement {
  return {
    id,
    kind: "box",
    content,
    x,
    y,
    width,
    height,
    visible: true,
    style: { borderColor: "#e2e8f0", padding: 6, fontSize: 10, fontWeight: "bold", color: "#64748b" },
  };
}

const BOX_BILL_TO = "box-billto";
const BOX_SHIP_TO = "box-shipto";
const BOX_CONTACT = "box-contact";
const BOX_META = "box-meta";
const BOX_TOTALS = "box-totals";

export const DEFAULT_INVOICE_TEMPLATE_LAYOUT: InvoiceTemplateLayout = {
  version: 2,
  letterheadUrl: null,
  logoUrl: null,
  footerImageUrl: null,
  showLogo: true,
  columns: [...DEFAULT_INVOICE_TABLE_COLUMNS],
  lineTable: { x: 2, y: 38, width: 96, visible: true },
  elements: [
    { id: "letterhead", kind: "letterhead", x: 0, y: 0, width: 100, height: 12, visible: false },
    { id: "logo", kind: "logo", x: 72, y: 2, width: 26, height: 10, visible: true },
    {
      id: "title-invoice",
      kind: "text",
      content: "INVOICE",
      x: 2,
      y: 2,
      width: 40,
      visible: true,
      style: { fontSize: 20, fontWeight: "bold", color: "#0f172a" },
    },
    topField("co-name", "company.name", "Company", 2, 8, 48),
    topField("co-address", "company.addressLine1", "Address", 2, 12, 48, { showLabel: false }),
    topField("co-tax", "company.taxRegistrationNumber", "Tax ID", 2, 16, 48),
    box(BOX_BILL_TO, "Bill To", 2, 22, 30, 14),
    childField("cust-name", BOX_BILL_TO, 0, "customer.displayName", "Customer", { showLabel: false }),
    childField("cust-bill1", BOX_BILL_TO, 1, "customer.billingAddressLine1", "Address", { showLabel: false }),
    childField("cust-vat", BOX_BILL_TO, 2, "customer.taxRegistrationNumber", "VAT/NTN"),
    box(BOX_SHIP_TO, "Ship To", 34, 22, 30, 14),
    childField("ship-name", BOX_SHIP_TO, 0, "customer.displayName", "Customer", { showLabel: false }),
    childField("ship-addr", BOX_SHIP_TO, 1, "customer.shippingAddressLine1", "Address", { showLabel: false }),
    box(BOX_CONTACT, "Customer details", 66, 22, 32, 14),
    childField("contact-person", BOX_CONTACT, 0, "customer.contactPersonName", "Contact"),
    childField("contact-mobile", BOX_CONTACT, 1, "customer.mobile", "Mobile"),
    childField("contact-dept", BOX_CONTACT, 2, "customer.contactPersonDepartment", "Department"),
    childField("po-ref", BOX_CONTACT, 3, "invoice.poReference", "PO Ref"),
    childField("delivery-date", BOX_CONTACT, 4, "invoice.deliveryDate", "Delivery date"),
    childField("delivery-challan", BOX_CONTACT, 5, "invoice.deliveryChallanNumber", "Challan no"),
    box(BOX_META, "Invoice details", 66, 2, 32, 16),
    childField("inv-no", BOX_META, 0, "invoice.number", "Invoice No."),
    childField("inv-issue", BOX_META, 1, "invoice.issueDate", "Issue date"),
    childField("inv-due", BOX_META, 2, "invoice.dueDate", "Due date"),
    { id: "lineTable", kind: "lineTable", x: 2, y: 38, width: 96, visible: true, yAnchor: "pageTop" },
    { ...box(BOX_TOTALS, "Totals", 58, 4, 40, 12), yAnchor: "afterLineTable" as const },
    childField("tot-sub", BOX_TOTALS, 0, "totals.subtotal", "Subtotal"),
    childField("tot-tax", BOX_TOTALS, 1, "totals.taxAmount", "Tax"),
    childField("tot-wht", BOX_TOTALS, 2, "totals.whtAmount", "WHT"),
    childField("tot-net", BOX_TOTALS, 3, "totals.netSettlement", "Net settlement"),
    childField("tot-grand", BOX_TOTALS, 4, "totals.total", "Total", {
      style: { fontSize: 13, fontWeight: "bold", color: "#0f172a" },
    }),
    {
      id: "notes",
      kind: "notes",
      x: 2,
      y: 4,
      width: 52,
      height: 10,
      visible: true,
      yAnchor: "afterLineTable",
    },
    {
      id: "footer",
      kind: "footer",
      content: "Thank you for your business.",
      x: 2,
      y: 8,
      width: 96,
      height: 8,
      visible: true,
      yAnchor: "pageBottom",
    },
    {
      id: "footer-thanks",
      kind: "text",
      parentId: "footer",
      sortOrder: 0,
      content: "Thank you for your business.",
      x: 0,
      y: 0,
      width: 100,
      visible: true,
      style: { fontSize: 11, color: "#64748b", textAlign: "left" },
    },
  ],
};

export function getFieldLabel(binding: string): string {
  return INVOICE_FIELD_CATALOG.find((field) => field.binding === binding)?.label ?? binding;
}

export function elementPreviewLabel(element: TemplateElement): string {
  if (element.kind === "field" && element.binding) {
    const prefix = element.showLabel !== false && element.label ? `${element.label}: ` : "";
    return `${prefix}${getFieldLabel(element.binding)}`;
  }
  if (element.kind === "text") return element.content ?? "Text line";
  if (element.kind === "image") return element.content?.trim() ? "Image" : "Image (empty)";
  if (element.kind === "box" || element.kind === "footer") {
    if (element.titleBinding) return `{${getFieldLabel(element.titleBinding)}}`;
    return element.content ?? (element.kind === "footer" ? "Footer" : "Box");
  }
  if (element.kind === "fbrDi") return KIND_LABELS.fbrDi;
  return KIND_LABELS[element.kind];
}

export function isCanvasContainer(el: TemplateElement): boolean {
  return CONTAINER_KINDS.has(el.kind);
}

const TABLE_HEADER_PCT = 3.66;
const ROW_HEIGHT_PCT = 3.26;
export const SAMPLE_PREVIEW_ROW_COUNT = 3;

export function estimateTableHeightPct(lineCount: number): number {
  if (lineCount <= 0) return TABLE_HEADER_PCT;
  return TABLE_HEADER_PCT + lineCount * ROW_HEIGHT_PCT;
}

export function getLineTableElement(elements: TemplateElement[]): TemplateElement | undefined {
  return elements.find((el) => el.kind === "lineTable" && !el.parentId);
}

export function inferYAnchor(el: TemplateElement, lineTableY: number): YAnchor {
  if (el.yAnchor) return el.yAnchor;
  if (el.kind === "footer" || el.kind === "fbrDi") return "pageBottom";
  if (el.kind === "lineTable") return "pageTop";
  if (el.y >= lineTableY) return "afterLineTable";
  return "pageTop";
}

export function elementHeightPct(el: TemplateElement): number {
  return el.height ?? (el.kind === "box" ? 12 : el.kind === "footer" || el.kind === "fbrDi" ? 16 : 10);
}

export function previewTableEndY(
  lineTableY: number,
  lineCount: number = SAMPLE_PREVIEW_ROW_COUNT,
): number {
  return lineTableY + estimateTableHeightPct(lineCount);
}

export function resolveCanvasTop(
  el: TemplateElement,
  layout: InvoiceTemplateLayout,
  lineCount: number = SAMPLE_PREVIEW_ROW_COUNT,
): number {
  const lineTable = getLineTableElement(layout.elements);
  const lineTableY = lineTable?.y ?? 38;
  const tableEndY = previewTableEndY(lineTableY, lineCount);
  const anchor = inferYAnchor(el, lineTableY);
  if (anchor === "pageTop") return el.y;
  if (anchor === "afterLineTable") return tableEndY + el.y;
  return 100 - el.y - elementHeightPct(el);
}

export function resolveCanvasHeight(el: TemplateElement): string | undefined {
  if (el.kind === "lineTable") {
    return `${estimateTableHeightPct(SAMPLE_PREVIEW_ROW_COUNT)}%`;
  }
  if (el.height != null) return `${el.height}%`;
  return undefined;
}

const BOX_GAP_PCT = 1;
const DEFAULT_BOX_HEIGHT_PCT = 14;
const DEFAULT_BOX_WIDTH_PCT = 30;

function defaultBoxStyle(): TemplateElementStyle {
  return {
    borderColor: "#e2e8f0",
    padding: 6,
    fontSize: 10,
    fontWeight: "bold",
    color: "#64748b",
  };
}

export function createBoxBeforeTable(layout: InvoiceTemplateLayout): TemplateElement {
  const lineTable = getLineTableElement(layout.elements);
  const lineTableY = lineTable?.y ?? 38;
  const boxHeight = DEFAULT_BOX_HEIGHT_PCT;
  const gap = BOX_GAP_PCT;

  let maxBottom = 0;
  for (const el of layout.elements) {
    if (el.visible === false || el.parentId) continue;
    if (el.kind === "lineTable" || el.kind === "footer" || el.kind === "fbrDi") continue;
    if (inferYAnchor(el, lineTableY) !== "pageTop") continue;
    maxBottom = Math.max(maxBottom, el.y + elementHeightPct(el));
  }

  const belowExisting = maxBottom + gap;
  const aboveTable = lineTableY - boxHeight - gap;
  const y = Math.max(0, Math.min(aboveTable, belowExisting));

  return {
    id: newElementId("box"),
    kind: "box",
    content: "Section",
    x: 2,
    y,
    width: DEFAULT_BOX_WIDTH_PCT,
    height: boxHeight,
    visible: true,
    yAnchor: "pageTop",
    style: defaultBoxStyle(),
  };
}

export function createBoxAfterTable(layout: InvoiceTemplateLayout): TemplateElement {
  const lineTable = getLineTableElement(layout.elements);
  const lineTableY = lineTable?.y ?? 38;
  const gap = BOX_GAP_PCT;
  const boxHeight = DEFAULT_BOX_HEIGHT_PCT;

  let maxOffset = 0;
  for (const el of layout.elements) {
    if (el.visible === false || el.parentId) continue;
    if (el.kind === "lineTable" || el.kind === "footer" || el.kind === "fbrDi") continue;
    if (inferYAnchor(el, lineTableY) !== "afterLineTable") continue;
    maxOffset = Math.max(maxOffset, el.y + elementHeightPct(el));
  }

  const y = maxOffset > 0 ? maxOffset + gap : 4;

  return {
    id: newElementId("box"),
    kind: "box",
    content: "Section",
    x: 2,
    y,
    width: DEFAULT_BOX_WIDTH_PCT,
    height: boxHeight,
    visible: true,
    yAnchor: "afterLineTable",
    style: defaultBoxStyle(),
  };
}

export function applyQuotationTitle(layout: InvoiceTemplateLayout): InvoiceTemplateLayout {
  return {
    ...layout,
    elements: layout.elements.map((el) =>
      el.kind === "text" && el.content?.trim().toUpperCase() === "INVOICE"
        ? { ...el, content: "QUOTATION" }
        : el,
    ),
  };
}

function emptyToOmittedUrl(value?: string | null): string | null {
  if (value == null || value.trim() === "") return null;
  return value;
}

/** Drop null/empty bindings and image URLs before POST/PATCH so Zod does not 400. */
export function sanitizeTemplateLayoutForApi(layout: InvoiceTemplateLayout): InvoiceTemplateLayout {
  return {
    ...layout,
    version: 2,
    letterheadUrl: emptyToOmittedUrl(layout.letterheadUrl),
    logoUrl: emptyToOmittedUrl(layout.logoUrl),
    footerImageUrl: emptyToOmittedUrl(layout.footerImageUrl),
    elements: layout.elements.map((el) => {
      const next: TemplateElement = { ...el };
      if (!next.titleBinding) delete next.titleBinding;
      if (!next.binding) delete next.binding;
      if (!next.parentId) delete next.parentId;
      return next;
    }),
  };
}

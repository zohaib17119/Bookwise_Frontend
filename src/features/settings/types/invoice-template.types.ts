export type InvoiceTableColumnKey =
  | "serial"
  | "product"
  | "description"
  | "qty"
  | "rate"
  | "discount"
  | "tax"
  | "total";

export type TemplateElementKind =
  | "field"
  | "text"
  | "box"
  | "letterhead"
  | "logo"
  | "lineTable"
  | "totals"
  | "notes"
  | "footer";

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
  columns: InvoiceTableColumnKey[];
  lineTable?: LineTableConfig;
  elements: TemplateElement[];
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
]);

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

export const COLUMN_LABELS: Record<InvoiceTableColumnKey, string> = {
  serial: "S.No",
  product: "Product",
  description: "Description",
  qty: "Qty",
  rate: "Rate",
  discount: "Discount",
  tax: "Tax",
  total: "Total",
};

export const KIND_LABELS: Record<TemplateElementKind, string> = {
  field: "Field line",
  text: "Text line",
  box: "Box",
  letterhead: "Letterhead",
  logo: "Logo",
  lineTable: "Line table",
  totals: "Totals block",
  notes: "Notes",
  footer: "Footer",
};

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
  columns: ["serial", "product", "description", "qty", "rate", "discount", "tax", "total"],
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
  if (element.kind === "box" || element.kind === "footer") {
    if (element.titleBinding) return `{${getFieldLabel(element.titleBinding)}}`;
    return element.content ?? (element.kind === "footer" ? "Footer" : "Box");
  }
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
  if (el.kind === "footer") return "pageBottom";
  if (el.kind === "lineTable") return "pageTop";
  if (el.y >= lineTableY) return "afterLineTable";
  return "pageTop";
}

export function elementHeightPct(el: TemplateElement): number {
  return el.height ?? (el.kind === "box" ? 12 : el.kind === "footer" ? 8 : 10);
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
    if (el.kind === "lineTable" || el.kind === "footer") continue;
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
    if (el.kind === "lineTable" || el.kind === "footer") continue;
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

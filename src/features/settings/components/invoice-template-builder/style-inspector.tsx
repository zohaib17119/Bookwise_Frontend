import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import FileInput from "@/components/ui/fileInput";
import {
  INVOICE_FIELD_CATALOG,
  KIND_LABELS,
  DEFAULT_FBR_DI_LAYOUT,
  elementPreviewLabel,
  getBoxChildren,
  inferYAnchor,
  getLineTableElement,
  mergeFbrDiLayout,
  type FbrDiLayoutConfig,
  type InvoiceTemplateLayout,
  type TemplateElement,
  type TemplateElementStyle,
} from "@/features/settings/types/invoice-template.types";

interface StyleInspectorProps {
  element: TemplateElement | null;
  layout: InvoiceTemplateLayout;
  canManage: boolean;
  onChange: (patch: Partial<TemplateElement>) => void;
  onDelete: () => void;
  onSelectChild: (id: string) => void;
  onReorderChild: (childId: string, direction: -1 | 1) => void;
  onAddTextToBox: (boxId: string) => void;
  onAddImageToBox: (boxId: string) => void;
}

function updateStyle(
  style: TemplateElementStyle | undefined,
  patch: Partial<TemplateElementStyle>,
): TemplateElementStyle {
  return { ...(style ?? {}), ...patch };
}

function patchFbrDiLayout(
  current: FbrDiLayoutConfig | undefined,
  patch: Partial<FbrDiLayoutConfig>,
): FbrDiLayoutConfig {
  return mergeFbrDiLayout({ ...current, ...patch });
}

export function StyleInspector({
  element,
  layout,
  canManage,
  onChange,
  onDelete,
  onSelectChild,
  onReorderChild,
  onAddTextToBox,
  onAddImageToBox,
}: StyleInspectorProps) {
  if (!element) {
    return (
      <p className="text-sm text-muted-foreground">
        Select a box or a line inside a box to edit labels, fonts, and colors.
      </p>
    );
  }

  const style = element.style ?? {};
  const isChild = Boolean(element.parentId);
  const isBox = element.kind === "box";
  const isFooter = element.kind === "footer";
  const isFbrDi = element.kind === "fbrDi";
  const isLineTable = element.kind === "lineTable";
  const isLogoOrLetterhead = element.kind === "logo" || element.kind === "letterhead";
  const canRepeatOnEveryPage = (isBox || isFooter || isLogoOrLetterhead) && !isChild;
  const canDelete = canManage && !isFbrDi;
  const lineTableY = getLineTableElement(layout.elements)?.y ?? 38;
  const yAnchor = inferYAnchor(element, lineTableY);
  const boxChildren = isBox || isFooter ? getBoxChildren(layout.elements, element.id) : [];
  const titleSource = element.titleBinding?.trim() ? element.titleBinding : "";
  const yLabel =
    yAnchor === "afterLineTable"
      ? "Y offset after table %"
      : yAnchor === "pageBottom"
        ? "Distance from bottom %"
        : "Y %";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{KIND_LABELS[element.kind]}</p>
        {canDelete ? (
          <button
            className="text-xs text-rose-600 hover:underline disabled:opacity-50"
            disabled={!canManage}
            onClick={onDelete}
            type="button"
          >
            Delete
          </button>
        ) : isFbrDi ? (
          <span className="text-[11px] text-muted-foreground">Required (FBR DI)</span>
        ) : null}
      </div>
      {isFbrDi ? (
        <p className="text-[11px] text-muted-foreground">
          Required FBR Digital Invoice block (number, logo, QR). Adjust size and position below —
          parts cannot be removed while FBR DI is enabled.
        </p>
      ) : null}

      {!isChild && isBox ? (
        <p className="text-[11px] text-muted-foreground">
          {yAnchor === "afterLineTable"
            ? "After table (offset from table end)"
            : "Before table (page top)"}
        </p>
      ) : null}

      {!isChild ? (
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-muted-foreground">
            X %
            <Input
              disabled={!canManage}
              max={100}
              min={0}
              onChange={(e) => onChange({ x: Number(e.target.value) || 0 })}
              type="number"
              value={Math.round(element.x)}
            />
          </label>
          <label className="text-xs text-muted-foreground">
            {yLabel}
            <Input
              disabled={!canManage}
              max={100}
              min={0}
              onChange={(e) => onChange({ y: Number(e.target.value) || 0 })}
              type="number"
              value={Math.round(element.y)}
            />
          </label>
          {yAnchor === "afterLineTable" ? (
            <p className="col-span-2 text-[11px] text-muted-foreground">
              Measured from where the line table ends, not from the top of the page.
            </p>
          ) : null}
          <label className="text-xs text-muted-foreground">
            Width %
            <Input
              disabled={!canManage}
              max={100}
              min={5}
              onChange={(e) => onChange({ width: Number(e.target.value) || 5 })}
              type="number"
              value={Math.round(element.width)}
            />
          </label>
          {isLineTable ? (
            <label className="text-xs text-muted-foreground">
              Max height % (optional)
              <Input
                disabled={!canManage}
                max={80}
                min={0}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  onChange({ maxHeight: value > 0 ? value : undefined });
                }}
                placeholder="Auto"
                type="number"
                value={element.maxHeight ?? ""}
              />
            </label>
          ) : (
            <label className="text-xs text-muted-foreground">
              Height %
              <Input
                disabled={!canManage || (yAnchor === "pageBottom" && !isFbrDi)}
                max={80}
                min={4}
                onChange={(e) => onChange({ height: Number(e.target.value) || 4 })}
                type="number"
                value={Math.round(element.height ?? (isFbrDi ? 16 : 8))}
              />
            </label>
          )}
        </div>
      ) : null}

      {canRepeatOnEveryPage ? (
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={Boolean(element.repeatOnEveryPage)}
            disabled={!canManage}
            onChange={(e) => onChange({ repeatOnEveryPage: e.target.checked })}
          />
          Repeat on every page
        </label>
      ) : null}

      {isBox || isFooter ? (
        <>
          <label className="block text-xs text-muted-foreground">
            Title source
            <Select
              disabled={!canManage}
              onChange={(e) => {
                const value = e.target.value;
                if (!value) {
                  onChange({ titleBinding: undefined });
                  return;
                }
                onChange({ titleBinding: value, content: "" });
              }}
              value={titleSource}
            >
              <option value="">Static text</option>
              {INVOICE_FIELD_CATALOG.map((field) => (
                <option key={field.binding} value={field.binding}>
                  {field.label}
                </option>
              ))}
            </Select>
          </label>
          {!titleSource ? (
            <label className="block text-xs text-muted-foreground">
              {isFooter ? "Footer title" : "Box title"}
              <Input
                disabled={!canManage}
                onChange={(e) => onChange({ content: e.target.value, titleBinding: undefined })}
                placeholder={isFooter ? "Thank you" : "Bill To"}
                value={element.content ?? ""}
              />
            </label>
          ) : (
            <p className="text-xs text-muted-foreground">
              Title uses field value: {INVOICE_FIELD_CATALOG.find((f) => f.binding === titleSource)?.label}
            </p>
          )}
          <div className="space-y-2 border-t pt-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Contents
              </p>
              <span className="flex gap-1">
                <Button
                  disabled={!canManage}
                  onClick={() => onAddTextToBox(element.id)}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  Add text
                </Button>
                <Button
                  disabled={!canManage}
                  onClick={() => onAddImageToBox(element.id)}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  Add image
                </Button>
              </span>
            </div>
            {boxChildren.length ? (
              <ul className="space-y-2">
                {boxChildren.map((child, index) => (
                  <li
                    className={`rounded-lg border px-2 py-2 text-xs ${
                      child.id === element.id ? "border-primary bg-primary/5" : ""
                    }`}
                    key={child.id}
                  >
                    <button
                      className="block w-full truncate text-left font-medium"
                      onClick={() => onSelectChild(child.id)}
                      type="button"
                    >
                      {elementPreviewLabel(child)}
                    </button>
                    <div className="mt-2 flex gap-1">
                      <Button
                        disabled={!canManage || index === 0}
                        onClick={() => onReorderChild(child.id, -1)}
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        ↑
                      </Button>
                      <Button
                        disabled={!canManage || index === boxChildren.length - 1}
                        onClick={() => onReorderChild(child.id, 1)}
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        ↓
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No lines yet. Add fields from the palette.</p>
            )}
          </div>
        </>
      ) : null}

      {element.kind === "field" ? (
        <>
          {!isChild ? (
            <label className="block text-xs text-muted-foreground">
              Field
              <Select
                disabled={!canManage}
                onChange={(e) => {
                  const field = INVOICE_FIELD_CATALOG.find((item) => item.binding === e.target.value);
                  onChange({
                    binding: e.target.value,
                    label: field?.label ?? element.label,
                  });
                }}
                value={element.binding ?? ""}
              >
                <option value="">Select field</option>
                {INVOICE_FIELD_CATALOG.map((field) => (
                  <option key={field.binding} value={field.binding}>
                    {field.label}
                  </option>
                ))}
              </Select>
            </label>
          ) : null}
          <label className="block text-xs text-muted-foreground">
            Display label
            <Input
              disabled={!canManage}
              onChange={(e) => onChange({ label: e.target.value })}
              placeholder="Invoice Number"
              value={element.label ?? ""}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={element.showLabel !== false}
              disabled={!canManage}
              onChange={(e) => onChange({ showLabel: e.target.checked })}
            />
            Show label before value
          </label>
        </>
      ) : null}

      {element.kind === "text" ? (
        <label className="block text-xs text-muted-foreground">
          Text content
          <Input
            disabled={!canManage}
            onChange={(e) => onChange({ content: e.target.value })}
            value={element.content ?? ""}
          />
        </label>
      ) : null}

      {element.kind === "image" ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Box image</p>
          {canManage ? (
            <FileInput
              logo={element.content ?? ""}
              setlogo={(url) => onChange({ content: url || "" })}
            />
          ) : null}
        </div>
      ) : null}

      {isFbrDi ? (
        <div className="space-y-3 border-t pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            FBR DI layout
          </p>
          {(() => {
            const di = mergeFbrDiLayout(element.fbrDiLayout);
            const setDi = (patch: Partial<FbrDiLayoutConfig>) =>
              onChange({ fbrDiLayout: patchFbrDiLayout(element.fbrDiLayout, patch) });
            return (
              <>
                <p className="text-[11px] font-medium text-foreground">Invoice number</p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs text-muted-foreground">
                    Font size
                    <Input
                      disabled={!canManage}
                      max={24}
                      min={8}
                      onChange={(e) =>
                        setDi({ invoiceFontSize: Number(e.target.value) || DEFAULT_FBR_DI_LAYOUT.invoiceFontSize })
                      }
                      type="number"
                      value={di.invoiceFontSize}
                    />
                  </label>
                  <label className="text-xs text-muted-foreground">
                    Font weight
                    <Select
                      disabled={!canManage}
                      onChange={(e) =>
                        setDi({ invoiceFontWeight: e.target.value as "normal" | "bold" })
                      }
                      value={di.invoiceFontWeight}
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                    </Select>
                  </label>
                  <label className="text-xs text-muted-foreground">
                    Text color
                    <Input
                      disabled={!canManage}
                      onChange={(e) => setDi({ invoiceColor: e.target.value })}
                      type="color"
                      value={di.invoiceColor}
                    />
                  </label>
                  <label className="text-xs text-muted-foreground">
                    Align
                    <Select
                      disabled={!canManage}
                      onChange={(e) =>
                        setDi({
                          invoiceTextAlign: e.target.value as "left" | "center" | "right",
                        })
                      }
                      value={di.invoiceTextAlign}
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </Select>
                  </label>
                  <label className="col-span-2 text-xs text-muted-foreground">
                    Margin below number (px)
                    <Input
                      disabled={!canManage}
                      max={40}
                      min={0}
                      onChange={(e) =>
                        setDi({
                          invoiceMarginBottomPx:
                            Number(e.target.value) || DEFAULT_FBR_DI_LAYOUT.invoiceMarginBottomPx,
                        })
                      }
                      type="number"
                      value={di.invoiceMarginBottomPx}
                    />
                  </label>
                </div>

                <p className="text-[11px] font-medium text-foreground">Logo</p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs text-muted-foreground">
                    Width (px)
                    <Input
                      disabled={!canManage}
                      max={200}
                      min={40}
                      onChange={(e) =>
                        setDi({ logoWidthPx: Number(e.target.value) || DEFAULT_FBR_DI_LAYOUT.logoWidthPx })
                      }
                      type="number"
                      value={di.logoWidthPx}
                    />
                  </label>
                  <label className="text-xs text-muted-foreground">
                    Offset X (px)
                    <Input
                      disabled={!canManage}
                      max={80}
                      min={-40}
                      onChange={(e) => setDi({ logoOffsetXPx: Number(e.target.value) || 0 })}
                      type="number"
                      value={di.logoOffsetXPx}
                    />
                  </label>
                  <label className="col-span-2 text-xs text-muted-foreground">
                    Offset Y (px)
                    <Input
                      disabled={!canManage}
                      max={80}
                      min={-40}
                      onChange={(e) => setDi({ logoOffsetYPx: Number(e.target.value) || 0 })}
                      type="number"
                      value={di.logoOffsetYPx}
                    />
                  </label>
                </div>

                <p className="text-[11px] font-medium text-foreground">QR code</p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs text-muted-foreground">
                    Size (px)
                    <Input
                      disabled={!canManage}
                      max={160}
                      min={48}
                      onChange={(e) =>
                        setDi({ qrSizePx: Number(e.target.value) || DEFAULT_FBR_DI_LAYOUT.qrSizePx })
                      }
                      type="number"
                      value={di.qrSizePx}
                    />
                  </label>
                  <label className="text-xs text-muted-foreground">
                    Offset X (px)
                    <Input
                      disabled={!canManage}
                      max={80}
                      min={-40}
                      onChange={(e) => setDi({ qrOffsetXPx: Number(e.target.value) || 0 })}
                      type="number"
                      value={di.qrOffsetXPx}
                    />
                  </label>
                  <label className="col-span-2 text-xs text-muted-foreground">
                    Offset Y (px)
                    <Input
                      disabled={!canManage}
                      max={80}
                      min={-40}
                      onChange={(e) => setDi({ qrOffsetYPx: Number(e.target.value) || 0 })}
                      type="number"
                      value={di.qrOffsetYPx}
                    />
                  </label>
                </div>

                <p className="text-[11px] font-medium text-foreground">Logo + QR row</p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs text-muted-foreground">
                    Gap (px)
                    <Input
                      disabled={!canManage}
                      max={40}
                      min={0}
                      onChange={(e) =>
                        setDi({ rowGapPx: Number(e.target.value) || 0 })
                      }
                      type="number"
                      value={di.rowGapPx}
                    />
                  </label>
                  <label className="text-xs text-muted-foreground">
                    Align
                    <Select
                      disabled={!canManage}
                      onChange={(e) =>
                        setDi({
                          rowAlign: e.target.value as "flex-start" | "center" | "flex-end",
                        })
                      }
                      value={di.rowAlign}
                    >
                      <option value="flex-start">Top</option>
                      <option value="center">Center</option>
                      <option value="flex-end">Bottom</option>
                    </Select>
                  </label>
                </div>
              </>
            );
          })()}
        </div>
      ) : null}

      {!isFbrDi ? (
      <div className="space-y-2 border-t pt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Style</p>
        <label className="block text-xs text-muted-foreground">
          Font size
          <Input
            disabled={!canManage}
            max={32}
            min={8}
            onChange={(e) =>
              onChange({ style: updateStyle(style, { fontSize: Number(e.target.value) || 11 }) })
            }
            type="number"
            value={style.fontSize ?? 11}
          />
        </label>
        <label className="block text-xs text-muted-foreground">
          Font weight
          <Select
            disabled={!canManage}
            onChange={(e) =>
              onChange({
                style: updateStyle(style, {
                  fontWeight: e.target.value as "normal" | "bold",
                }),
              })
            }
            value={style.fontWeight ?? "normal"}
          >
            <option value="normal">Normal</option>
            <option value="bold">Bold</option>
          </Select>
        </label>
        <label className="block text-xs text-muted-foreground">
          Text color
          <Input
            disabled={!canManage}
            onChange={(e) => onChange({ style: updateStyle(style, { color: e.target.value }) })}
            type="color"
            value={style.color ?? "#334155"}
          />
        </label>
        {!isChild ? (
          <label className="block text-xs text-muted-foreground">
            Border color
            <Input
              disabled={!canManage}
              onChange={(e) =>
                onChange({ style: updateStyle(style, { borderColor: e.target.value }) })
              }
              type="color"
              value={style.borderColor ?? "#e2e8f0"}
            />
          </label>
        ) : null}
        <label className="block text-xs text-muted-foreground">
          Text align
          <Select
            disabled={!canManage}
            onChange={(e) =>
              onChange({
                style: updateStyle(style, {
                  textAlign: e.target.value as "left" | "center" | "right",
                }),
              })
            }
            value={style.textAlign ?? "left"}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </Select>
        </label>
      </div>
      ) : null}
    </div>
  );
}

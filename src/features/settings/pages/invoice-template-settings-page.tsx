import { useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import FileInput from "@/components/ui/fileInput";
import { ErrorState } from "@/components/shared/error-state";
import { FieldPalette } from "@/features/settings/components/invoice-template-builder/field-palette";
import { StyleInspector } from "@/features/settings/components/invoice-template-builder/style-inspector";
import { TemplateCanvas } from "@/features/settings/components/invoice-template-builder/template-canvas";
import { SettingsSectionCard } from "@/components/settings/settings-section-card";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { canUsePermission } from "@/features/permissions/utils/module-permissions";
import { useCompanySettings } from "@/features/settings/hooks/use-settings";
import {
  useCreateInvoiceDocumentTemplate,
  useInvoiceDocumentTemplates,
  usePreviewInvoiceDocumentTemplate,
  useUpdateInvoiceDocumentTemplate,
} from "@/features/settings/hooks/use-invoice-templates";
import {
  COLUMN_LABELS,
  DEFAULT_INVOICE_TEMPLATE_LAYOUT,
  addChildToBox,
  applyQuotationTitle,
  createBoxAfterTable,
  createBoxBeforeTable,
  newElementId,
  removeElementAndChildren,
  reorderBoxChild,
  inferYAnchor,
  getLineTableElement,
  sanitizeTemplateLayoutForApi,
  type DocumentTemplateKind,
  type InvoiceTableColumnKey,
  type InvoiceTemplateLayout,
  type TemplateElement,
} from "@/features/settings/types/invoice-template.types";
import { firstFieldErrorMessage } from "@/lib/api/error";

function cloneLayout(layout: InvoiceTemplateLayout): InvoiceTemplateLayout {
  return structuredClone(layout);
}

function ensureSerialColumn(layout: InvoiceTemplateLayout): InvoiceTemplateLayout {
  if (layout.columns.includes("serial")) return layout;
  return { ...layout, columns: ["serial", ...layout.columns] };
}

function moveColumn(
  columns: InvoiceTableColumnKey[],
  index: number,
  direction: -1 | 1,
): InvoiceTableColumnKey[] {
  const next = [...columns];
  const target = index + direction;
  if (target < 0 || target >= next.length) return next;
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}

export function InvoiceTemplateSettingsPage({
  documentKind = "INVOICE",
}: {
  documentKind?: DocumentTemplateKind;
}) {
  const isEstimate = documentKind === "ESTIMATE";
  const { companyId, permissions } = useActiveCompany();
  const canManage = canUsePermission(permissions, [
    "invoices.manage",
    "company.update",
    ...(isEstimate ? (["estimates.manage"] as const) : []),
  ]);
  const companySettingsQuery = useCompanySettings(companyId);
  const templatesQuery = useInvoiceDocumentTemplates(companyId, documentKind);
  const invoiceTemplatesQuery = useInvoiceDocumentTemplates(
    isEstimate ? companyId : undefined,
    "INVOICE",
  );
  const createMutation = useCreateInvoiceDocumentTemplate(companyId, documentKind);
  const updateMutation = useUpdateInvoiceDocumentTemplate(companyId, documentKind);
  const previewMutation = usePreviewInvoiceDocumentTemplate(companyId);

  const [name, setName] = useState(isEstimate ? "Company quotation" : "Company invoice");
  const [layout, setLayout] = useState<InvoiceTemplateLayout>(DEFAULT_INVOICE_TEMPLATE_LAYOUT);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const defaultTemplate = useMemo(
    () => templatesQuery.data?.find((t) => t.isDefault) ?? templatesQuery.data?.[0] ?? null,
    [templatesQuery.data],
  );
  const invoiceFallbackTemplate = useMemo(
    () =>
      invoiceTemplatesQuery.data?.find((t) => t.isDefault) ??
      invoiceTemplatesQuery.data?.[0] ??
      null,
    [invoiceTemplatesQuery.data],
  );

  const companyLogoUrl = companySettingsQuery.data?.logoUrl ?? "";

  useEffect(() => {
    if (isEstimate) {
      if (templatesQuery.isLoading || invoiceTemplatesQuery.isLoading) return;
      if (defaultTemplate) {
        setActiveTemplateId(defaultTemplate.id);
        setName(defaultTemplate.name);
        const next = ensureSerialColumn(cloneLayout(defaultTemplate.layoutJson));
        if (!next.logoUrl && companyLogoUrl) {
          next.logoUrl = companyLogoUrl;
        }
        setLayout(next);
        setPreviewHtml(defaultTemplate.compiledHtml || "");
        return;
      }
      setActiveTemplateId(null);
      setName("Company quotation");
      const source = invoiceFallbackTemplate
        ? applyQuotationTitle(cloneLayout(invoiceFallbackTemplate.layoutJson))
        : applyQuotationTitle(cloneLayout(DEFAULT_INVOICE_TEMPLATE_LAYOUT));
      if (!source.logoUrl && companyLogoUrl) {
        source.logoUrl = companyLogoUrl;
      }
      setLayout(ensureSerialColumn(source));
      setPreviewHtml("");
      return;
    }

    if (!defaultTemplate) return;
    setActiveTemplateId(defaultTemplate.id);
    setName(defaultTemplate.name);
    const next = ensureSerialColumn(cloneLayout(defaultTemplate.layoutJson));
    if (!next.logoUrl && companyLogoUrl) {
      next.logoUrl = companyLogoUrl;
    }
    setLayout(next);
    setPreviewHtml(defaultTemplate.compiledHtml || "");
  }, [
    isEstimate,
    defaultTemplate?.id,
    invoiceFallbackTemplate?.id,
    companyLogoUrl,
    templatesQuery.isLoading,
    invoiceTemplatesQuery.isLoading,
  ]);

  const selectedElement = layout.elements.find((el) => el.id === selectedId) ?? null;
  const selectedBoxId =
    selectedElement?.kind === "box"
      ? selectedElement.id
      : selectedElement?.parentId ?? null;
  const resolvedLogoUrl = layout.logoUrl || companyLogoUrl || "";

  const updateElement = (id: string, patch: Partial<TemplateElement>) => {
    setLayout((prev) => ({
      ...prev,
      elements: prev.elements.map((el) => (el.id === id ? { ...el, ...patch } : el)),
    }));
  };

  const onPointerDown = (event: React.PointerEvent, element: TemplateElement) => {
    if (!canManage) return;
    const canvas = (event.currentTarget as HTMLElement).parentElement;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const startXPct = ((event.clientX - rect.left) / rect.width) * 100;
    const startYPct = ((event.clientY - rect.top) / rect.height) * 100;
    dragOffset.current = { x: startXPct - element.x, y: startYPct - element.y };
    setDragId(element.id);
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!dragId) return;
    const canvas = event.currentTarget as HTMLElement;
    const rect = canvas.getBoundingClientRect();
    const xPct = ((event.clientX - rect.left) / rect.width) * 100 - dragOffset.current.x;
    const yPct = ((event.clientY - rect.top) / rect.height) * 100 - dragOffset.current.y;
    const lineTableY = getLineTableElement(layout.elements)?.y ?? 38;
    setLayout((prev) => ({
      ...prev,
      elements: prev.elements.map((el) => {
        if (el.id !== dragId) return el;
        const anchor = inferYAnchor(el, lineTableY);
        return {
          ...el,
          x: Math.min(100 - el.width, Math.max(0, xPct)),
          y:
            anchor === "pageTop" || el.kind === "lineTable"
              ? Math.min(95, Math.max(0, yPct))
              : el.y,
        };
      }),
    }));
  };

  const onPointerUp = () => setDragId(null);

  const handleSave = async () => {
    if (!companyId) return;
    const payload = sanitizeTemplateLayoutForApi({ ...layout, version: 2 });
    if (activeTemplateId) {
      await updateMutation.mutateAsync({
        templateId: activeTemplateId,
        payload: { name, isDefault: true, layoutJson: payload },
      });
    } else {
      const created = await createMutation.mutateAsync({
        name,
        kind: documentKind,
        isDefault: true,
        layoutJson: payload,
      });
      setActiveTemplateId(created.id);
    }
    const html = await previewMutation.mutateAsync(payload);
    setPreviewHtml(html);
  };

  const handlePreview = async () => {
    const html = await previewMutation.mutateAsync(
      sanitizeTemplateLayoutForApi({ ...layout, version: 2 }),
    );
    setPreviewHtml(html);
  };

  if (templatesQuery.error) {
    return (
      <ErrorState
        description={templatesQuery.error.message}
        title={isEstimate ? "Unable to load estimate templates" : "Unable to load invoice templates"}
      />
    );
  }

  return (
    <div className="space-y-6">
      {(createMutation.error || updateMutation.error || previewMutation.error) && (
        <Alert
          description={
            firstFieldErrorMessage(
              createMutation.error || updateMutation.error || previewMutation.error,
            ) || undefined
          }
          title={
            createMutation.error?.message ||
            updateMutation.error?.message ||
            previewMutation.error?.message ||
            "Something went wrong"
          }
          variant="destructive"
        />
      )}

      <SettingsSectionCard
        description={
          isEstimate
            ? "Starts as a copy of your invoice template until you save. After the first save, quotation layout is independent."
            : "Add boxes, select a box, then place fields inside it. Each line has its own label and font. Empty values are hidden on the invoice PDF."
        }
        title={isEstimate ? "Estimate / quotation PDF template" : "Invoice PDF template"}
      >
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Template name
            </label>
            <Input disabled={!canManage} onChange={(e) => setName(e.target.value)} value={name} />
          </div>
          <Button
            disabled={!canManage || createMutation.isPending || updateMutation.isPending}
            onClick={handleSave}
          >
            {activeTemplateId ? "Save template" : "Create & save"}
          </Button>
          <Button disabled={previewMutation.isPending} onClick={handlePreview} variant="secondary">
            Refresh preview
          </Button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)_280px]">
          <aside className="space-y-4 rounded-xl border p-3">
            <p className="text-sm font-semibold">Available fields</p>
            <FieldPalette
              canManage={canManage}
              onAddBoxBeforeTable={() => {
                const element = createBoxBeforeTable(layout);
                setLayout((prev) => ({ ...prev, elements: [...prev.elements, element] }));
                setSelectedId(element.id);
              }}
              onAddBoxAfterTable={() => {
                const element = createBoxAfterTable(layout);
                setLayout((prev) => ({ ...prev, elements: [...prev.elements, element] }));
                setSelectedId(element.id);
              }}
              onAddField={(binding, label) => {
                if (!selectedBoxId) return;
                setLayout((prev) =>
                  addChildToBox(prev, selectedBoxId, {
                    id: newElementId("field"),
                    kind: "field",
                    binding,
                    label,
                    showLabel: true,
                    x: 0,
                    y: 0,
                    width: 100,
                    visible: true,
                    style: { fontSize: 11, color: "#334155", textAlign: "left" },
                  }),
                );
              }}
              onAddSpecial={(kind) => {
                const id = newElementId(kind);
                setLayout((prev) => ({
                  ...prev,
                  elements: [
                    ...prev.elements,
                    {
                      id,
                      kind,
                      x: 10,
                      y: 40,
                      width: kind === "lineTable" ? 96 : 40,
                      height: kind === "lineTable" ? undefined : 10,
                      visible: true,
                      ...(kind === "lineTable" ? { yAnchor: "pageTop" as const } : {}),
                    },
                  ],
                }));
                setSelectedId(id);
              }}
              onAddText={() => {
                if (!selectedBoxId) return;
                setLayout((prev) =>
                  addChildToBox(prev, selectedBoxId, {
                    id: newElementId("text"),
                    kind: "text",
                    content: "Your text",
                    x: 0,
                    y: 0,
                    width: 100,
                    visible: true,
                    style: { fontSize: 11, color: "#334155", textAlign: "left" },
                  }),
                );
              }}
              selectedBoxId={selectedBoxId}
            />

            <div className="space-y-2 border-t pt-3">
              <p className="text-sm font-semibold">Images</p>
              <label className="text-xs text-muted-foreground">Letterhead</label>
              {canManage ? (
                <FileInput
                  logo={layout.letterheadUrl ?? ""}
                  setlogo={(url) =>
                    setLayout((prev) => ({
                      ...prev,
                      letterheadUrl: url || null,
                      elements: prev.elements.some((el) => el.kind === "letterhead")
                        ? prev.elements.map((el) =>
                            el.kind === "letterhead" ? { ...el, visible: Boolean(url) } : el,
                          )
                        : [
                            ...prev.elements,
                            {
                              id: "letterhead",
                              kind: "letterhead" as const,
                              x: 0,
                              y: 0,
                              width: 100,
                              height: 12,
                              visible: Boolean(url),
                            },
                          ],
                    }))
                  }
                />
              ) : null}
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={layout.showLogo !== false}
                  disabled={!canManage}
                  onChange={(e) => setLayout((prev) => ({ ...prev, showLogo: e.target.checked }))}
                />
                Show logo
              </label>
              {canManage ? (
                <FileInput
                  logo={resolvedLogoUrl}
                  setlogo={(url) =>
                    setLayout((prev) => ({
                      ...prev,
                      logoUrl: url || null,
                      showLogo: Boolean(url) || prev.showLogo,
                    }))
                  }
                />
              ) : null}
              <label className="text-xs text-muted-foreground">Footer image</label>
              {canManage ? (
                <FileInput
                  logo={layout.footerImageUrl ?? ""}
                  setlogo={(url) => setLayout((prev) => ({ ...prev, footerImageUrl: url || null }))}
                />
              ) : null}
            </div>

            <div className="space-y-2 border-t pt-3">
              <p className="text-sm font-semibold">Table columns</p>
              <ul className="space-y-2">
                {layout.columns.map((column, index) => (
                  <li
                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                    key={column}
                  >
                    <span>{COLUMN_LABELS[column]}</span>
                    <span className="flex gap-1">
                      <Button
                        disabled={!canManage || index === 0}
                        onClick={() =>
                          setLayout((prev) => ({
                            ...prev,
                            columns: moveColumn(prev.columns, index, -1),
                          }))
                        }
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        ↑
                      </Button>
                      <Button
                        disabled={!canManage || index === layout.columns.length - 1}
                        onClick={() =>
                          setLayout((prev) => ({
                            ...prev,
                            columns: moveColumn(prev.columns, index, 1),
                          }))
                        }
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        ↓
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <div className="space-y-4">
            <TemplateCanvas
              canManage={canManage}
              dragId={dragId}
              layout={layout}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onSelect={setSelectedId}
              resolvedLogoUrl={resolvedLogoUrl}
              selectedId={selectedId}
            />
            {previewHtml ? (
              <div className="overflow-hidden rounded-xl border">
                <iframe
                  className="h-[520px] w-full bg-white"
                  srcDoc={previewHtml}
                  title={isEstimate ? "Estimate template preview" : "Invoice template preview"}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Save or refresh preview to see the compiled HTML template.
              </p>
            )}
          </div>

          <aside className="rounded-xl border p-3">
            <p className="mb-3 text-sm font-semibold">Element settings</p>
            <StyleInspector
              canManage={canManage}
              element={selectedElement}
              layout={layout}
              onAddTextToBox={(boxId) => {
                setLayout((prev) =>
                  addChildToBox(prev, boxId, {
                    id: newElementId("text"),
                    kind: "text",
                    content: "Your text",
                    x: 0,
                    y: 0,
                    width: 100,
                    visible: true,
                    style: { fontSize: 11, color: "#334155", textAlign: "left" },
                  }),
                );
              }}
              onChange={(patch) => {
                if (!selectedId) return;
                updateElement(selectedId, patch);
              }}
              onDelete={() => {
                if (!selectedId) return;
                setLayout((prev) => removeElementAndChildren(prev, selectedId));
                setSelectedId(null);
              }}
              onReorderChild={(childId, direction) => {
                setLayout((prev) => reorderBoxChild(prev, childId, direction));
              }}
              onSelectChild={setSelectedId}
            />
          </aside>
        </div>
      </SettingsSectionCard>
    </div>
  );
}

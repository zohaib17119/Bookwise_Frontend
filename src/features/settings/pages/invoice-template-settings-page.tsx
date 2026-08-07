import { useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import FileInput from "@/components/ui/fileInput";
import { ErrorState } from "@/components/shared/error-state";
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
  BLOCK_LABELS,
  COLUMN_LABELS,
  DEFAULT_INVOICE_TEMPLATE_LAYOUT,
  type InvoiceTableColumnKey,
  type InvoiceTemplateBlock,
  type InvoiceTemplateBlockType,
  type InvoiceTemplateLayout,
} from "@/features/settings/types/invoice-template.types";

function cloneLayout(layout: InvoiceTemplateLayout): InvoiceTemplateLayout {
  return structuredClone(layout);
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

function SizeControls({
  block,
  canManage,
  onChange,
}: {
  block: InvoiceTemplateBlock | undefined;
  canManage: boolean;
  onChange: (patch: Partial<InvoiceTemplateBlock>) => void;
}) {
  if (!block) return null;
  return (
    <div className="grid grid-cols-2 gap-2">
      <label className="text-xs text-muted-foreground">
        Width %
        <Input
          disabled={!canManage}
          max={100}
          min={10}
          onChange={(e) => onChange({ width: Number(e.target.value) || 10 })}
          type="number"
          value={Math.round(block.width)}
        />
      </label>
      <label className="text-xs text-muted-foreground">
        Height %
        <Input
          disabled={!canManage}
          max={80}
          min={4}
          onChange={(e) => onChange({ height: Number(e.target.value) || 4 })}
          type="number"
          value={Math.round(block.height ?? 10)}
        />
      </label>
    </div>
  );
}

export function InvoiceTemplateSettingsPage() {
  const { companyId, permissions } = useActiveCompany();
  const canManage = canUsePermission(permissions, ["invoices.manage", "company.update"]);
  const companySettingsQuery = useCompanySettings(companyId);
  const templatesQuery = useInvoiceDocumentTemplates(companyId);
  const createMutation = useCreateInvoiceDocumentTemplate(companyId);
  const updateMutation = useUpdateInvoiceDocumentTemplate(companyId);
  const previewMutation = usePreviewInvoiceDocumentTemplate(companyId);

  const [name, setName] = useState("Company invoice");
  const [layout, setLayout] = useState<InvoiceTemplateLayout>(DEFAULT_INVOICE_TEMPLATE_LAYOUT);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const defaultTemplate = useMemo(
    () => templatesQuery.data?.find((t) => t.isDefault) ?? templatesQuery.data?.[0] ?? null,
    [templatesQuery.data],
  );

  const companyLogoUrl = companySettingsQuery.data?.logoUrl ?? "";

  useEffect(() => {
    if (!defaultTemplate) return;
    setActiveTemplateId(defaultTemplate.id);
    setName(defaultTemplate.name);
    const next = cloneLayout(defaultTemplate.layoutJson);
    if (!next.logoUrl && companyLogoUrl) {
      next.logoUrl = companyLogoUrl;
    }
    setLayout(next);
    setPreviewHtml(defaultTemplate.compiledHtml || "");
  }, [defaultTemplate?.id, companyLogoUrl]);

  const getBlock = (type: InvoiceTemplateBlockType) =>
    layout.blocks.find((b) => b.type === type);

  const updateBlock = (idOrType: string, patch: Partial<InvoiceTemplateBlock>) => {
    setLayout((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) =>
        b.id === idOrType || b.type === idOrType ? { ...b, ...patch } : b,
      ),
    }));
  };

  const resolvedLogoUrl = layout.logoUrl || companyLogoUrl || "";

  const onPointerDown = (event: React.PointerEvent, block: InvoiceTemplateBlock) => {
    if (!canManage || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const startXPct = ((event.clientX - rect.left) / rect.width) * 100;
    const startYPct = ((event.clientY - rect.top) / rect.height) * 100;
    dragOffset.current = { x: startXPct - block.x, y: startYPct - block.y };
    setDragId(block.id);
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!dragId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const xPct = ((event.clientX - rect.left) / rect.width) * 100 - dragOffset.current.x;
    const yPct = ((event.clientY - rect.top) / rect.height) * 100 - dragOffset.current.y;
    setLayout((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) =>
        b.id === dragId
          ? {
              ...b,
              x: Math.min(100 - b.width, Math.max(0, xPct)),
              y: Math.min(95, Math.max(0, yPct)),
            }
          : b,
      ),
    }));
  };

  const onPointerUp = () => setDragId(null);

  const handleSave = async () => {
    if (!companyId) return;
    if (activeTemplateId) {
      await updateMutation.mutateAsync({
        templateId: activeTemplateId,
        payload: { name, isDefault: true, layoutJson: layout },
      });
    } else {
      const created = await createMutation.mutateAsync({
        name,
        isDefault: true,
        layoutJson: layout,
      });
      setActiveTemplateId(created.id);
    }
    const html = await previewMutation.mutateAsync(layout);
    setPreviewHtml(html);
  };

  const handlePreview = async () => {
    const html = await previewMutation.mutateAsync(layout);
    setPreviewHtml(html);
  };

  if (templatesQuery.error) {
    return (
      <ErrorState
        description={templatesQuery.error.message}
        title="Unable to load invoice templates"
      />
    );
  }

  const letterheadBlock = getBlock("letterhead");
  const logoBlock = getBlock("logo");
  const footerBlock = getBlock("footer");

  return (
    <div className="space-y-6">
      {(createMutation.error || updateMutation.error || previewMutation.error) && (
        <Alert
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
        description="Drag blocks on the A4 canvas, upload letterhead/logo/footer images, resize them, and reorder line columns. Saved layout becomes this company’s invoice PDF template."
        title="Invoice PDF template"
      >
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Template name
            </label>
            <Input
              disabled={!canManage}
              onChange={(e) => setName(e.target.value)}
              value={name}
            />
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

        <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <div className="space-y-2 rounded-xl border p-3">
              <p className="text-sm font-semibold">Letterhead</p>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={letterheadBlock?.visible ?? false}
                  disabled={!canManage}
                  onChange={(e) => updateBlock("letterhead", { visible: e.target.checked })}
                />
                Show letterhead image
              </label>
              {canManage ? (
                <FileInput
                  logo={layout.letterheadUrl ?? ""}
                  setlogo={(url) =>
                    setLayout((prev) => ({
                      ...prev,
                      letterheadUrl: url || null,
                      blocks: prev.blocks.map((b) =>
                        b.type === "letterhead" ? { ...b, visible: Boolean(url) } : b,
                      ),
                    }))
                  }
                />
              ) : null}
              <SizeControls
                block={letterheadBlock}
                canManage={canManage}
                onChange={(patch) => updateBlock("letterhead", patch)}
              />
            </div>

            <div className="space-y-2 rounded-xl border p-3">
              <p className="text-sm font-semibold">Logo</p>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={layout.showLogo && (logoBlock?.visible ?? true)}
                  disabled={!canManage}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setLayout((prev) => ({
                      ...prev,
                      showLogo: checked,
                      blocks: prev.blocks.map((b) =>
                        b.type === "logo" ? { ...b, visible: checked } : b,
                      ),
                    }));
                  }}
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
                      blocks: prev.blocks.map((b) =>
                        b.type === "logo" ? { ...b, visible: Boolean(url) || b.visible } : b,
                      ),
                    }))
                  }
                />
              ) : resolvedLogoUrl ? (
                <img
                  alt="Company logo"
                  className="h-16 w-auto rounded-lg border object-contain"
                  src={resolvedLogoUrl}
                />
              ) : null}
              {!layout.logoUrl && companyLogoUrl ? (
                <p className="text-xs text-muted-foreground">
                  Using company settings logo. Upload here to override for invoices.
                </p>
              ) : null}
              <SizeControls
                block={logoBlock}
                canManage={canManage}
                onChange={(patch) => updateBlock("logo", patch)}
              />
            </div>

            <div className="space-y-2 rounded-xl border p-3">
              <p className="text-sm font-semibold">Footer image</p>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={footerBlock?.visible ?? false}
                  disabled={!canManage}
                  onChange={(e) => updateBlock("footer", { visible: e.target.checked })}
                />
                Show footer block
              </label>
              {canManage ? (
                <FileInput
                  logo={layout.footerImageUrl ?? ""}
                  setlogo={(url) =>
                    setLayout((prev) => ({
                      ...prev,
                      footerImageUrl: url || null,
                      blocks: prev.blocks.map((b) =>
                        b.type === "footer" ? { ...b, visible: true } : b,
                      ),
                    }))
                  }
                />
              ) : null}
              <SizeControls
                block={footerBlock}
                canManage={canManage}
                onChange={(patch) => updateBlock("footer", patch)}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Blocks</p>
              {layout.blocks.map((block) => (
                <label className="flex items-center gap-2 text-sm" key={block.id}>
                  <Checkbox
                    checked={block.visible}
                    disabled={!canManage}
                    onChange={(e) => updateBlock(block.id, { visible: e.target.checked })}
                  />
                  {BLOCK_LABELS[block.type]}
                </label>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Table columns</p>
              <p className="text-xs text-muted-foreground">
                Move columns up/down to change invoice line order.
              </p>
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
            <div
              className="relative mx-auto aspect-[210/297] w-full max-w-[640px] overflow-hidden rounded-xl border bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_40%)] shadow-sm"
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              ref={canvasRef}
            >
              {layout.blocks
                .filter((b) => b.visible)
                .map((block) => {
                  const mediaUrl =
                    block.type === "letterhead"
                      ? layout.letterheadUrl
                      : block.type === "logo"
                        ? resolvedLogoUrl
                        : block.type === "footer"
                          ? layout.footerImageUrl
                          : null;

                  return (
                    <div
                      className={`absolute cursor-grab overflow-hidden rounded-md border border-dashed border-primary/40 bg-white/90 p-2 text-[10px] shadow-sm ${
                        dragId === block.id ? "cursor-grabbing ring-2 ring-primary" : ""
                      }`}
                      key={block.id}
                      onPointerDown={(e) => onPointerDown(e, block)}
                      style={{
                        left: `${block.x}%`,
                        top: `${block.y}%`,
                        width: `${block.width}%`,
                        height:
                          block.height != null
                            ? `${block.height}%`
                            : block.type === "lineTable"
                              ? "18%"
                              : "auto",
                        minHeight: block.type === "lineTable" ? "18%" : "6%",
                      }}
                    >
                      <p className="mb-1 font-semibold text-primary">
                        {BLOCK_LABELS[block.type]}
                      </p>
                      {mediaUrl ? (
                        <img
                          alt={BLOCK_LABELS[block.type]}
                          className="h-[calc(100%-1.25rem)] w-full object-contain"
                          draggable={false}
                          src={mediaUrl}
                        />
                      ) : block.type === "lineTable" ? (
                        <p className="text-muted-foreground">
                          Columns: {layout.columns.map((c) => COLUMN_LABELS[c]).join(" → ")}
                        </p>
                      ) : (
                        <p className="text-muted-foreground">Drag to reposition</p>
                      )}
                    </div>
                  );
                })}
            </div>

            {previewHtml ? (
              <div className="overflow-hidden rounded-xl border">
                <iframe
                  className="h-[520px] w-full bg-white"
                  srcDoc={previewHtml}
                  title="Invoice template preview"
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Save or refresh preview to see the compiled HTML template.
              </p>
            )}
          </div>
        </div>
      </SettingsSectionCard>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { FileMinus2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/shared/form-field";
import type { AdjustmentNoteLinePayload } from "@/features/creditNotes/api/credit-notes.api";
import { useInvoice, useInvoices } from "@/features/invoices/hooks/use-invoices";
import type { Invoice, InvoiceLine } from "@/features/invoices/types/invoice.types";
import { getDocumentPreviewTotals } from "@/features/shared/utils/document-calculations";
import { useSubmitLock } from "@/hooks/use-submit-lock";
import { cn } from "@/lib/utils/cn";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { MONEY_EPSILON, parseMoney, toMoneyString } from "@/lib/utils/money";
import { toDecimalString, toMoneyDecimalString } from "@/features/shared/utils/decimal-string";

const BLOCKED_STATUSES = new Set(["DRAFT", "CANCELLED", "VOID"]);
const QTY_EPSILON = 0.0001;

export type AdjustmentNoteType = "CREDIT_NOTE" | "DEBIT_NOTE";

type EditableLine = {
  key: string;
  included: boolean;
  itemId?: string;
  itemName?: string;
  description: string;
  originalQuantity: string;
  originalUnitPrice: string;
  originalLineTotal: string;
  quantity: string;
  unitPrice: string;
  discountType?: "PERCENTAGE" | "FIXED" | null;
  discountValue?: string | null;
  taxRateId?: string | null;
  taxCodeId?: string | null;
  taxRate: string;
};

type CreateAdjustmentNoteDialogProps = {
  open: boolean;
  companyId: string;
  baseCurrency: string;
  /** Lock type when opened from CN/DN list or invoice detail. */
  fixedType?: AdjustmentNoteType;
  /** Pre-select invoice when opened from invoice detail. */
  presetInvoiceId?: string;
  isPending?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onConfirm: (payload: {
    noteType: AdjustmentNoteType;
    originalInvoiceId: string;
    notes: string;
    lines: AdjustmentNoteLinePayload[];
  }) => void | Promise<void>;
};

function isEligibleInvoice(invoice: Invoice) {
  return !BLOCKED_STATUSES.has(invoice.status ?? "");
}

function toEditableLines(lines: InvoiceLine[]): EditableLine[] {
  return lines.map((line, index) => {
    const quantity = toDecimalString(line.quantity ?? "0", 4) || "0.0000";
    const unitPrice = toDecimalString(line.unitPrice ?? "0", 4) || "0.0000";
    const originalLineTotal =
      toMoneyDecimalString(line.lineTotal) ||
      toMoneyString(parseMoney(quantity) * parseMoney(unitPrice));
    return {
      key: line.id ?? `line-${index}`,
      included: true,
      itemId: line.itemId ?? undefined,
      itemName: line.itemName ?? line.item?.name ?? undefined,
      description: line.description,
      originalQuantity: quantity,
      originalUnitPrice: unitPrice,
      originalLineTotal,
      quantity,
      unitPrice,
      discountType: line.discountType ?? null,
      discountValue: line.discountValue ?? null,
      taxRateId: line.taxRateId ?? null,
      taxCodeId: line.taxCodeId ?? null,
      taxRate: line.taxRate ?? "0",
    };
  });
}

export function CreateAdjustmentNoteDialog({
  open,
  companyId,
  baseCurrency,
  fixedType,
  presetInvoiceId,
  isPending = false,
  errorMessage,
  onClose,
  onConfirm,
}: CreateAdjustmentNoteDialogProps) {
  const [noteType, setNoteType] = useState<AdjustmentNoteType>(fixedType ?? "CREDIT_NOTE");
  const [originalInvoiceId, setOriginalInvoiceId] = useState(presetInvoiceId ?? "");
  const [notes, setNotes] = useState("");
  const [editLines, setEditLines] = useState<EditableLine[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);

  const invoicesQuery = useInvoices(open ? companyId : undefined, { limit: 100 });
  const invoiceQuery = useInvoice(
    open ? companyId : undefined,
    originalInvoiceId || null,
  );

  useEffect(() => {
    if (!open) return;
    setNoteType(fixedType ?? "CREDIT_NOTE");
    setOriginalInvoiceId(presetInvoiceId ?? "");
    setNotes("");
    setEditLines([]);
    setLocalError(null);
  }, [open, fixedType, presetInvoiceId]);

  useEffect(() => {
    if (!open || !invoiceQuery.data?.lines) return;
    setEditLines(toEditableLines(invoiceQuery.data.lines));
  }, [open, invoiceQuery.data?.id, invoiceQuery.data?.lines]);

  const eligible = useMemo(
    () => (invoicesQuery.data ?? []).filter(isEligibleInvoice),
    [invoicesQuery.data],
  );

  const includedLines = useMemo(
    () => editLines.filter((l) => l.included),
    [editLines],
  );

  const preview = useMemo(
    () =>
      getDocumentPreviewTotals(
        includedLines.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discountType: l.discountType,
          discountValue: l.discountValue,
          taxRate: l.taxRate,
        })),
      ),
    [includedLines],
  );

  const currency = invoiceQuery.data?.currencyCode ?? baseCurrency;
  const typeLabel = noteType === "CREDIT_NOTE" ? "credit note" : "debit note";

  const resetAndClose = () => {
    setLocalError(null);
    onClose();
  };

  const handleConfirm = useSubmitLock(async () => {
    setLocalError(null);
    if (!originalInvoiceId) {
      setLocalError("Select an issued invoice");
      return;
    }
    if (notes.trim().length < 3) {
      setLocalError("Reason is required (at least 3 characters)");
      return;
    }
    if (!includedLines.length) {
      setLocalError("Include at least one line");
      return;
    }
    for (const line of includedLines) {
      const qty = parseMoney(line.quantity);
      const price = parseMoney(line.unitPrice);
      const maxQty = parseMoney(line.originalQuantity);
      if (!(qty > 0) || qty > maxQty + QTY_EPSILON) {
        setLocalError(`Invalid quantity for “${line.description}” (max ${line.originalQuantity})`);
        return;
      }
      if (price < 0) {
        setLocalError(`Invalid unit price for “${line.description}”`);
        return;
      }
      const linePreview = getDocumentPreviewTotals([
        {
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discountType: line.discountType,
          discountValue: line.discountValue,
          taxRate: line.taxRate,
        },
      ]);
      if (linePreview.total > parseMoney(line.originalLineTotal) + MONEY_EPSILON) {
        setLocalError(
          `Amount for “${line.description}” exceeds original line total (${toMoneyString(line.originalLineTotal)})`,
        );
        return;
      }
    }

    const lines: AdjustmentNoteLinePayload[] = includedLines.map((l) => ({
      itemId: l.itemId,
      itemName: l.itemName,
      description: l.description,
      quantity: toDecimalString(l.quantity, 4) || "0",
      unitPrice: toDecimalString(l.unitPrice, 4) || "0",
      ...(l.discountType ? { discountType: l.discountType } : {}),
      ...(l.discountValue ? { discountValue: String(l.discountValue) } : {}),
      ...(l.taxRateId ? { taxRateId: l.taxRateId } : {}),
      ...(l.taxCodeId ? { taxCodeId: l.taxCodeId } : {}),
    }));

    await onConfirm({
      noteType,
      originalInvoiceId,
      notes: notes.trim(),
      lines,
    });
  }, isPending);

  if (!open) return null;

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm transition",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={isPending ? undefined : resetAndClose}
      />
      <div
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 scale-95 p-4 opacity-0 transition",
          open && "scale-100 opacity-100",
        )}
      >
        <div className="surface max-h-[90vh] overflow-y-auto p-6">
          <div className="flex gap-4">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <FileMinus2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold">
                Create {typeLabel}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Adjust quantities or prices against an issued invoice, enter a reason, then issue.
                Line totals cannot exceed the original invoice lines.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {errorMessage || localError ? (
              <Alert title={errorMessage || localError || ""} variant="destructive" />
            ) : null}

            {!fixedType ? (
              <FormField label="Document type">
                <Select
                  disabled={isPending}
                  onChange={(e) => setNoteType(e.target.value as AdjustmentNoteType)}
                  value={noteType}
                >
                  <option value="CREDIT_NOTE">Credit note</option>
                  <option value="DEBIT_NOTE">Debit note</option>
                </Select>
              </FormField>
            ) : null}

            <FormField label="Original invoice">
              <Select
                disabled={isPending || invoicesQuery.isLoading || Boolean(presetInvoiceId)}
                onChange={(e) => setOriginalInvoiceId(e.target.value)}
                value={originalInvoiceId}
              >
                <option value="">
                  {invoicesQuery.isLoading ? "Loading invoices…" : "Select issued invoice"}
                </option>
                {eligible.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoiceNumber || "Invoice"} — {invoice.customerName || "Customer"} —{" "}
                    {formatDate(invoice.issueDate)} —{" "}
                    {formatCurrency(
                      invoice.total ?? invoice.totals?.total ?? "0",
                      invoice.currencyCode ?? baseCurrency,
                    )}
                  </option>
                ))}
              </Select>
            </FormField>

            {originalInvoiceId && invoiceQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading invoice lines…</p>
            ) : null}

            {editLines.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-border/70">
                <table className="w-full min-w-[36rem] text-sm">
                  <thead>
                    <tr className="border-b border-border/70 bg-muted/40 text-start">
                      <th className="px-3 py-2 font-medium">Include</th>
                      <th className="px-3 py-2 font-medium">Item</th>
                      <th className="px-3 py-2 text-end font-medium">Qty</th>
                      <th className="px-3 py-2 text-end font-medium">Unit price</th>
                      <th className="px-3 py-2 text-end font-medium">Line total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editLines.map((line) => {
                      const lineTotal = getDocumentPreviewTotals([
                        {
                          description: line.description,
                          quantity: line.quantity,
                          unitPrice: line.unitPrice,
                          discountType: line.discountType,
                          discountValue: line.discountValue,
                          taxRate: line.taxRate,
                        },
                      ]).total;
                      return (
                        <tr key={line.key} className="border-b border-border/50">
                          <td className="px-3 py-2">
                            <input
                              checked={line.included}
                              disabled={isPending}
                              onChange={(e) =>
                                setEditLines((prev) =>
                                  prev.map((row) =>
                                    row.key === line.key
                                      ? { ...row, included: e.target.checked }
                                      : row,
                                  ),
                                )
                              }
                              type="checkbox"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <p className="font-medium">{line.itemName || line.description}</p>
                            {line.itemName ? (
                              <p className="text-xs text-muted-foreground">{line.description}</p>
                            ) : null}
                            <p className="text-xs text-muted-foreground">
                              Original: {line.originalQuantity} ×{" "}
                              {toMoneyString(line.originalUnitPrice)}
                            </p>
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              className="h-9 text-end"
                              disabled={isPending || !line.included}
                              max={line.originalQuantity}
                              min={0}
                              onChange={(e) =>
                                setEditLines((prev) =>
                                  prev.map((row) =>
                                    row.key === line.key
                                      ? { ...row, quantity: e.target.value }
                                      : row,
                                  ),
                                )
                              }
                              step="0.0001"
                              type="number"
                              value={line.quantity}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              className="h-9 text-end"
                              disabled={isPending || !line.included}
                              min={0}
                              onChange={(e) =>
                                setEditLines((prev) =>
                                  prev.map((row) =>
                                    row.key === line.key
                                      ? { ...row, unitPrice: e.target.value }
                                      : row,
                                  ),
                                )
                              }
                              step="0.0001"
                              type="number"
                              value={line.unitPrice}
                            />
                          </td>
                          <td className="px-3 py-2 text-end tabular-nums">
                            {formatCurrency(lineTotal, currency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}

            <FormField label="Reason (required)">
              <textarea
                className="flex min-h-[5rem] w-full rounded-xl border bg-white px-4 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                disabled={isPending}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Returned goods / price adjustment / undercharged"
                value={notes}
              />
            </FormField>

            {includedLines.length > 0 ? (
              <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">{formatCurrency(preview.subtotal, currency)}</span>
                </div>
                <div className="mt-1 flex justify-between gap-4">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="tabular-nums">{formatCurrency(preview.taxTotal, currency)}</span>
                </div>
                <div className="mt-2 flex justify-between gap-4 font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">{formatCurrency(preview.total, currency)}</span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button disabled={isPending} onClick={resetAndClose} type="button" variant="ghost">
              Cancel
            </Button>
            <Button
              disabled={!originalInvoiceId || !includedLines.length}
              isLoading={isPending}
              onClick={handleConfirm}
              type="button"
              variant="primary"
            >
              Create {typeLabel}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

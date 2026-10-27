import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { PageContainer } from "@/components/shared/page-container";
import { Input } from "@/components/ui/input";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import {
  useCreateDeliveryChallan,
  useDeliveryChallanRemaining,
} from "@/features/invoices/hooks/use-delivery-challans";
import { getApiErrorMessage } from "@/lib/api/error";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";

type LineDraft = {
  invoiceLineId: string;
  checked: boolean;
  quantity: string;
  maxQty: string;
  lineNumber: number;
  itemName: string | null;
  description: string | null;
  orderedQty: string;
  deliveredQty: string;
};

function trimQty(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return String(n);
}

export function DeliveryChallanCreatePage() {
  const navigate = useNavigate();
  const { companyId, invoiceId } = useParams();
  const { permissions } = useActiveCompany();
  const canView = canViewEntity(permissions, "invoices");
  const canManage = canManageEntity(permissions, "invoices");

  const remainingQuery = useDeliveryChallanRemaining(companyId, invoiceId ?? null, canView);
  const createMutation = useCreateDeliveryChallan(companyId, invoiceId ?? null);

  const [notes, setNotes] = useState("");
  const [challanDate, setChallanDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!remainingQuery.data) return;
    setLines(
      remainingQuery.data.lines
        .filter((line) => Number(line.remainingQty) > 0)
        .map((line) => ({
          invoiceLineId: line.invoiceLineId,
          checked: true,
          quantity: trimQty(line.remainingQty),
          maxQty: trimQty(line.remainingQty),
          lineNumber: line.lineNumber,
          itemName: line.itemName,
          description: line.description,
          orderedQty: trimQty(line.orderedQty),
          deliveredQty: trimQty(line.deliveredQty),
        })),
    );
  }, [remainingQuery.data]);

  const selectedCount = useMemo(() => lines.filter((l) => l.checked).length, [lines]);

  if (!canView || !canManage) {
    return (
      <ErrorState
        title="Invoice access restricted"
        description="Your current company membership does not include invoice manage access."
      />
    );
  }

  if (remainingQuery.isLoading) {
    return (
      <PageContainer>
        <div className="surface p-6">Loading remaining quantities…</div>
      </PageContainer>
    );
  }

  if (remainingQuery.error || !remainingQuery.data) {
    return (
      <ErrorState
        title="Invoice not found"
        description={remainingQuery.error?.message ?? "Unable to load delivery quantities."}
      />
    );
  }

  const remaining = remainingQuery.data;
  const backPath = `/app/company/${companyId}/invoices/${invoiceId}`;

  if (!remaining.canCreate || lines.length === 0) {
    return (
      <PageContainer className="space-y-4">
        <ErrorState
          title="Nothing left to deliver"
          description="All invoice line quantities already have delivery challans, or this invoice cannot receive a challan."
        />
        <Button asChild variant="secondary">
          <Link to={backPath}>Back to invoice</Link>
        </Button>
      </PageContainer>
    );
  }

  const onSubmit = async () => {
    setFormError(null);
    const payloadLines = lines
      .filter((l) => l.checked)
      .map((l) => ({ invoiceLineId: l.invoiceLineId, quantity: l.quantity }));

    if (payloadLines.length === 0) {
      setFormError("Select at least one line");
      return;
    }

    for (const line of lines.filter((l) => l.checked)) {
      const qty = Number(line.quantity);
      const max = Number(line.maxQty);
      if (!Number.isFinite(qty) || qty <= 0) {
        setFormError(`Line ${line.lineNumber}: quantity must be greater than zero`);
        return;
      }
      if (qty > max) {
        setFormError(`Line ${line.lineNumber}: quantity cannot exceed remaining ${line.maxQty}`);
        return;
      }
    }

    try {
      const created = await createMutation.mutateAsync({
        challanDate: challanDate || undefined,
        notes: notes.trim() || null,
        lines: payloadLines,
      });
      navigate(backPath, {
        state: { deliveryChallanCreatedId: created.id, deliveryChallanNumber: created.challanNumber },
      });
    } catch (err) {
      setFormError(getApiErrorMessage(err));
    }
  };

  return (
    <PageContainer className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create delivery challan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Invoice {remaining.invoiceNumber} — enter quantities up to the remaining amount per line.
          </p>
        </div>
        <Button asChild variant="ghost">
          <Link to={backPath}>Cancel</Link>
        </Button>
      </div>

      <div className="surface space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="challanDate">
              Challan date
            </label>
            <Input
              id="challanDate"
              type="date"
              value={challanDate}
              onChange={(e) => setChallanDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="notes">
              Notes
            </label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-2 font-medium">Include</th>
                <th className="py-2 pr-2 font-medium">#</th>
                <th className="py-2 pr-2 font-medium">Item</th>
                <th className="py-2 pr-2 font-medium">Ordered</th>
                <th className="py-2 pr-2 font-medium">Delivered</th>
                <th className="py-2 pr-2 font-medium">Remaining</th>
                <th className="py-2 font-medium">This challan qty</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.invoiceLineId} className="border-b border-border/60">
                  <td className="py-2 pr-2">
                    <input
                      type="checkbox"
                      checked={line.checked}
                      onChange={(e) =>
                        setLines((prev) =>
                          prev.map((row) =>
                            row.invoiceLineId === line.invoiceLineId
                              ? { ...row, checked: e.target.checked }
                              : row,
                          ),
                        )
                      }
                    />
                  </td>
                  <td className="py-2 pr-2">{line.lineNumber}</td>
                  <td className="py-2 pr-2">
                    <div className="font-medium">{line.itemName || "—"}</div>
                    {line.description ? (
                      <div className="text-xs text-muted-foreground">{line.description}</div>
                    ) : null}
                  </td>
                  <td className="py-2 pr-2">{line.orderedQty}</td>
                  <td className="py-2 pr-2">{line.deliveredQty}</td>
                  <td className="py-2 pr-2">{line.maxQty}</td>
                  <td className="py-2">
                    <Input
                      className="max-w-[8rem]"
                      disabled={!line.checked}
                      inputMode="decimal"
                      value={line.quantity}
                      onChange={(e) =>
                        setLines((prev) =>
                          prev.map((row) =>
                            row.invoiceLineId === line.invoiceLineId
                              ? { ...row, quantity: e.target.value }
                              : row,
                          ),
                        )
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            disabled={createMutation.isPending || selectedCount === 0}
            isLoading={createMutation.isPending}
            onClick={() => void onSubmit()}
            type="button"
            variant="primary"
          >
            Create delivery challan
          </Button>
          <span className="text-sm text-muted-foreground">
            {selectedCount} line{selectedCount === 1 ? "" : "s"} selected
          </span>
        </div>
      </div>
    </PageContainer>
  );
}

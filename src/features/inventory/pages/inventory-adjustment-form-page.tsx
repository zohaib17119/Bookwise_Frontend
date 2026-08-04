import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdjustmentLineEditor } from "@/components/accounting/adjustment-line-editor";
import { ErrorState } from "@/components/shared/error-state";
import { FormField } from "@/components/shared/form-field";
import { FormSection } from "@/components/shared/form-section";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import {
  useCreateInventoryAdjustment,
  useInventoryAdjustment,
  useUpdateInventoryAdjustment,
} from "@/features/inventory/hooks/use-inventory";
import {
  inventoryAdjustmentSchema,
  type InventoryAdjustmentFormInput,
  type InventoryAdjustmentFormValues,
} from "@/features/inventory/schemas/inventory-adjustment.schema";
import { useItemOptions } from "@/features/items/hooks/use-items";
import { canManageEntity } from "@/features/permissions/utils/module-permissions";
import { toDecimalString, toOptionalDecimalString } from "@/features/shared/utils/decimal-string";

interface InventoryAdjustmentFormPageProps {
  mode: "create" | "edit";
}

export function InventoryAdjustmentFormPage({ mode }: InventoryAdjustmentFormPageProps) {
  const navigate = useNavigate();
  const { companyId, inventoryAdjustmentId } = useParams();
  const { permissions } = useActiveCompany();
  const canManage = canManageEntity(permissions, "inventory");
  const itemsQuery = useItemOptions(companyId);
  const adjustmentQuery = useInventoryAdjustment(companyId, mode === "edit" ? inventoryAdjustmentId ?? null : null);
  const createMutation = useCreateInventoryAdjustment(companyId);
  const updateMutation = useUpdateInventoryAdjustment(companyId, inventoryAdjustmentId ?? null);
  const [purchaseGate, setPurchaseGate] = useState<"choose" | "adjustment">(
    mode === "create" ? "choose" : "adjustment",
  );
  const form = useForm<InventoryAdjustmentFormInput, undefined, InventoryAdjustmentFormValues>({
    resolver: zodResolver(inventoryAdjustmentSchema),
    values:
      mode === "edit" && adjustmentQuery.data
        ? {
            adjustmentDate: adjustmentQuery.data.adjustmentDate ?? "",
            reason: adjustmentQuery.data.reason ?? "",
            notes: adjustmentQuery.data.notes ?? "",
            lines:
              adjustmentQuery.data.lines?.map((line) => ({
                itemId: line.itemId,
                quantity: line.quantity,
                direction: line.direction,
                unitCost: line.unitCost ?? 0,
                notes: line.notes ?? "",
              })) ?? [],
          }
        : {
            adjustmentDate: "",
            reason: "",
            notes: "",
            lines: [
              {
                itemId: "",
                quantity: 0,
                direction: "IN",
                unitCost: 0,
                notes: "",
              },
            ],
          },
  });

  const activeMutation = mode === "create" ? createMutation : updateMutation;
  const isLocked = adjustmentQuery.data?.status === "POSTED";
  const watchedLines = form.watch("lines");
  const hasIncrease = useMemo(
    () => (watchedLines ?? []).some((line) => line.direction === "IN" && Number(line.quantity) > 0),
    [watchedLines],
  );

  if (!canManage) {
    return <Alert title="Inventory editing is unavailable" description="Your current company membership does not include inventory management." variant="destructive" />;
  }

  if (mode === "edit" && adjustmentQuery.error) {
    return <ErrorState title="Unable to load adjustment" description={adjustmentQuery.error.message} />;
  }

  if (mode === "create" && purchaseGate === "choose") {
    return (
      <PageContainer
        header={
          <PageHeader
            actions={
              <Button asChild variant="ghost">
                <Link to={`/app/company/${companyId}/inventory/adjustments`}>Back to adjustments</Link>
              </Button>
            }
            description="Purchased stock should use a Vendor Bill (Issue → Receive). Use an adjustment only for counts, found stock, or shrinkage."
            eyebrow="Inventory"
            title="Add stock"
          />
        }
      >
        <div className="surface grid gap-4 p-6 md:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-border/70 p-5">
            <h3 className="text-lg font-semibold">Create Vendor Bill for this Stock Purchase</h3>
            <p className="text-sm text-muted-foreground">
              Recommended for buying inventory from a vendor. Issue the bill, then Receive goods to increase quantity.
            </p>
            <Button asChild variant="primary">
              <Link to={`/app/company/${companyId}/bills/new?from=adjustment`}>Create Vendor Bill</Link>
            </Button>
          </div>
          <div className="space-y-3 rounded-xl border border-border/70 p-5">
            <h3 className="text-lg font-semibold">Adjustment only (no vendor bill)</h3>
            <p className="text-sm text-muted-foreground">
              Use for inventory corrections that are not purchases (count variance, found stock, damage).
            </p>
            <Button onClick={() => setPurchaseGate("adjustment")} type="button" variant="outline">
              Continue with adjustment
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      header={
        <PageHeader
          actions={
            <Button asChild variant="ghost">
              <Link to={`/app/company/${companyId}/inventory/adjustments`}>Back to adjustments</Link>
            </Button>
          }
          description="Prepare a draft inventory adjustment. Backend posting rules remain authoritative."
          eyebrow="Inventory"
          title={mode === "create" ? "New Inventory Adjustment" : "Edit Inventory Adjustment"}
        />
      }
    >
      <form
        className="space-y-6"
        onSubmit={form.handleSubmit(async (values) => {
          const payload = {
            adjustmentDate: values.adjustmentDate || undefined,
            reason: values.reason || undefined,
            notes: values.notes || undefined,
            lines: values.lines.map((line) => ({
              itemId: line.itemId,
              quantity: toDecimalString(line.quantity),
              direction: line.direction,
              ...(line.unitCost ? { unitCost: toOptionalDecimalString(line.unitCost) } : {}),
              notes: line.notes || undefined,
            })),
          };
          const result =
            mode === "create"
              ? await createMutation.mutateAsync(payload)
              : await updateMutation.mutateAsync(payload);
          navigate(`/app/company/${companyId}/inventory/adjustments/${result.id}`);
        })}
      >
        {activeMutation.error ? <Alert title={activeMutation.error.message} variant="destructive" /> : null}
        {mode === "create" && hasIncrease ? (
          <Alert
            description="Increase lines add quantity without Accounts Payable. Prefer Vendor Bill → Issue → Receive for purchases."
            title="Purchased stock?"
            variant="default"
          />
        ) : null}
        <div className="surface space-y-6 p-6">
          <FormSection title="Adjustment header">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Adjustment date">
                <Input disabled={isLocked} type="date" {...form.register("adjustmentDate")} />
              </FormField>
              <FormField label="Reason">
                <Input disabled={isLocked} {...form.register("reason")} placeholder="Stock count correction" />
              </FormField>
            </div>
            <FormField label="Notes">
              <Textarea disabled={isLocked} {...form.register("notes")} placeholder="Explain why the adjustment was needed" />
            </FormField>
          </FormSection>
          <FormSection title="Adjustment lines">
            <AdjustmentLineEditor control={form.control} disabled={isLocked} items={itemsQuery.data ?? []} name="lines" />
          </FormSection>
        </div>
        <Button disabled={isLocked} isLoading={activeMutation.isPending} type="submit">
          {mode === "create" ? "Create adjustment" : "Save adjustment"}
        </Button>
      </form>
    </PageContainer>
  );
}

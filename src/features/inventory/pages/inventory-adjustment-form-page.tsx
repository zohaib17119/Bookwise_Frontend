import { zodResolver } from "@hookform/resolvers/zod";
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

  if (!canManage) {
    return <Alert title="Inventory editing is unavailable" description="Your current company membership does not include inventory management." variant="destructive" />;
  }

  if (mode === "edit" && adjustmentQuery.error) {
    return <ErrorState title="Unable to load adjustment" description={adjustmentQuery.error.message} />;
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
              quantity: Number(line.quantity),
              direction: line.direction,
              unitCost: Number(line.unitCost || 0),
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

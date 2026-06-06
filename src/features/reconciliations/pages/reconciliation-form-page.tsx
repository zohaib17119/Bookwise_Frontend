import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormSection } from "@/components/shared/form-section";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { useBankAccounts } from "@/features/banking/hooks/use-banking";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { canUsePermission } from "@/features/permissions/utils/module-permissions";
import {
  reconciliationSchema,
  type ReconciliationFormInput,
  type ReconciliationFormValues,
} from "@/features/reconciliations/schemas/reconciliation.schema";
import { useCreateReconciliation } from "@/features/reconciliations/hooks/use-reconciliations";

export function ReconciliationFormPage() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { permissions } = useActiveCompany();
  const canManage = canUsePermission(permissions, ["reconciliations.manage", "banking.manage"]);
  const bankAccountsQuery = useBankAccounts(companyId);
  const createMutation = useCreateReconciliation(companyId);
  const form = useForm<ReconciliationFormInput, undefined, ReconciliationFormValues>({
    resolver: zodResolver(reconciliationSchema),
    defaultValues: {
      bankAccountId: "",
      startDate: "",
      endDate: "",
      statementEndingBalance: 0,
    },
  });

  return (
    <PageContainer
      header={
        <PageHeader
          actions={
            <Button asChild variant="ghost">
              <Link to={`/app/company/${companyId}/banking/reconciliations`}>Back to reconciliations</Link>
            </Button>
          }
          description="Open a new reconciliation session for a bank account and statement period."
          eyebrow="Banking"
          title="New Reconciliation"
        />
      }
    >
      <form
        className="surface space-y-6 p-6"
        onSubmit={form.handleSubmit(async (values) => {
          const result = await createMutation.mutateAsync({
            ...values,
            startDate: values.startDate || undefined,
            endDate: values.endDate || undefined,
            statementEndingBalance: Number(values.statementEndingBalance),
          });
          navigate(`/app/company/${companyId}/banking/reconciliations/${result.id}`);
        })}
      >
        {createMutation.error ? <Alert title={createMutation.error.message} variant="destructive" /> : null}
        <FormSection title="Session details">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Bank account</span>
              <Select disabled={!canManage} {...form.register("bankAccountId")}>
                <option value="">Select bank account</option>
                {(bankAccountsQuery.data ?? []).map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Statement ending balance</span>
              <Input disabled={!canManage} step="0.01" type="number" {...form.register("statementEndingBalance")} />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Start date</span>
              <Input disabled={!canManage} type="date" {...form.register("startDate")} />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">End date</span>
              <Input disabled={!canManage} type="date" {...form.register("endDate")} />
            </label>
          </div>
        </FormSection>
        <Button disabled={!canManage} isLoading={createMutation.isPending} type="submit">
          Create reconciliation
        </Button>
      </form>
    </PageContainer>
  );
}

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AccountSelect } from "@/components/accounting/account-select";
import { FormSection } from "@/components/shared/form-section";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { useAccountOptions } from "@/features/accounts/hooks/use-accounts";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import {
  taxSettingsSchema,
  type TaxSettingsFormInput,
  type TaxSettingsFormValues,
} from "@/features/tax/schemas/tax-settings.schema";
import { useTaxSettings, useUpsertTaxSettings } from "@/features/tax/hooks/use-tax";
import { ErrorState } from "@/components/shared/error-state";

export function TaxSettingsPage() {
  const { companyId, permissions } = useActiveCompany();
  const canView = canViewEntity(permissions, "tax");
  const canManage = canManageEntity(permissions, "tax");
  const settingsQuery = useTaxSettings(companyId);
  const accountOptionsQuery = useAccountOptions(companyId);
  const upsertMutation = useUpsertTaxSettings(companyId);

  const form = useForm<TaxSettingsFormInput, undefined, TaxSettingsFormValues>({
    resolver: zodResolver(taxSettingsSchema),
    values: {
      salesTaxPayableAccountId: (settingsQuery.data?.salesTaxPayableAccountId as string | undefined) ?? "",
      purchaseTaxRecoverableAccountId:
        (settingsQuery.data?.purchaseTaxRecoverableAccountId as string | undefined) ?? "",
    },
  });

  if (!canView) {
    return <ErrorState title="Tax access restricted" description="Your current company membership does not include tax visibility." />;
  }

  return (
    <PageContainer
      header={
        <PageHeader
          description="Map company tax control accounts and defaults used by tax reporting and transaction posting."
          eyebrow="Tax"
          title="Tax Settings"
        />
      }
    >
      {settingsQuery.error ? (
        <ErrorState title="Unable to load tax settings" description={settingsQuery.error.message} />
      ) : null}

      <form
        className="surface space-y-6 p-6"
        onSubmit={form.handleSubmit(async (values) => {
          await upsertMutation.mutateAsync({
            salesTaxPayableAccountId: values.salesTaxPayableAccountId || null,
            purchaseTaxRecoverableAccountId: values.purchaseTaxRecoverableAccountId || null,
          });
        })}
      >
        {upsertMutation.error ? <Alert title={upsertMutation.error.message} variant="destructive" /> : null}
        <FormSection title="Tax accounts">
          <div className="grid gap-4 md:grid-cols-2">
            <AccountSelect
              label="Sales tax payable account"
              onChange={(value) => form.setValue("salesTaxPayableAccountId", value)}
              options={accountOptionsQuery.data ?? []}
              value={form.watch("salesTaxPayableAccountId") ?? ""}
            />
            <AccountSelect
              label="Purchase tax recoverable account"
              onChange={(value) => form.setValue("purchaseTaxRecoverableAccountId", value)}
              options={accountOptionsQuery.data ?? []}
              value={form.watch("purchaseTaxRecoverableAccountId") ?? ""}
            />
          </div>
        </FormSection>
        <Button disabled={!canManage} isLoading={upsertMutation.isPending} type="submit">
          Save tax settings
        </Button>
      </form>
    </PageContainer>
  );
}

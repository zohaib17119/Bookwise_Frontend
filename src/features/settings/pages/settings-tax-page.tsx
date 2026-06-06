import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AccountSelect } from "@/components/accounting/account-select";
import { SettingsSectionCard } from "@/components/settings/settings-section-card";
import { useAccountOptions } from "@/features/accounts/hooks/use-accounts";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { canUsePermission } from "@/features/permissions/utils/module-permissions";
import {
  taxSettingsSchema,
  type TaxSettingsFormInput,
  type TaxSettingsFormValues,
} from "@/features/tax/schemas/tax-settings.schema";
import { useTaxSettings, useUpsertTaxSettings } from "@/features/tax/hooks/use-tax";
import { ErrorState } from "@/components/shared/error-state";

export function SettingsTaxPage() {
  const { companyId, permissions } = useActiveCompany();
  const canView = canUsePermission(permissions, ["tax.view", "settings.read", "settings.manage"]);
  const canManage = canUsePermission(permissions, ["tax.manage", "settings.manage"]);
  const taxSettingsQuery = useTaxSettings(companyId);
  const accountOptionsQuery = useAccountOptions(companyId);
  const upsertMutation = useUpsertTaxSettings(companyId);

  const form = useForm<TaxSettingsFormInput, undefined, TaxSettingsFormValues>({
    resolver: zodResolver(taxSettingsSchema),
    values: {
      salesTaxPayableAccountId:
        (taxSettingsQuery.data?.salesTaxPayableAccountId as string | undefined) ?? "",
      purchaseTaxRecoverableAccountId:
        (taxSettingsQuery.data?.purchaseTaxRecoverableAccountId as string | undefined) ?? "",
    },
  });

  if (!canView) {
    return (
      <ErrorState
        title="Tax settings access restricted"
        description="Your current company membership does not include tax settings visibility."
      />
    );
  }

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(async (values) => {
        await upsertMutation.mutateAsync({
          salesTaxPayableAccountId: values.salesTaxPayableAccountId || null,
          purchaseTaxRecoverableAccountId: values.purchaseTaxRecoverableAccountId || null,
        });
      })}
    >
      {taxSettingsQuery.error ? (
        <ErrorState
          title="Unable to load tax settings"
          description={taxSettingsQuery.error.message}
        />
      ) : null}
      {upsertMutation.error ? <Alert title={upsertMutation.error.message} variant="destructive" /> : null}

      <SettingsSectionCard
        description="Map tax control accounts used by tax calculation and reporting."
        title="Tax Control Accounts"
      >
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
      </SettingsSectionCard>

      <div className="flex justify-end">
        <Button disabled={!canManage} isLoading={upsertMutation.isPending} type="submit">
          Save tax settings
        </Button>
      </div>
    </form>
  );
}

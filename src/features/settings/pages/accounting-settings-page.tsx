import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FieldGrid } from "@/components/shared/field-grid";
import { FormField } from "@/components/shared/form-field";
import { SettingsSectionCard } from "@/components/settings/settings-section-card";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { canUsePermission } from "@/features/permissions/utils/module-permissions";
import {
  accountingSettingsSchema,
  type AccountingSettingsFormInput,
  type AccountingSettingsFormValues,
} from "@/features/settings/schemas/accounting-settings.schema";
import {
  useAccountingSettings,
  useUpsertAccountingSettings,
} from "@/features/settings/hooks/use-settings";
import { ErrorState } from "@/components/shared/error-state";

export function AccountingSettingsPage() {
  const { companyId, permissions } = useActiveCompany();
  const canView = canUsePermission(permissions, ["accounting_settings.view", "settings.read", "settings.manage"]);
  const canManage = canUsePermission(permissions, ["accounting_settings.manage", "settings.manage"]);
  const accountingSettingsQuery = useAccountingSettings(companyId);
  const upsertMutation = useUpsertAccountingSettings(companyId);

  const form = useForm<AccountingSettingsFormInput, undefined, AccountingSettingsFormValues>({
    resolver: zodResolver(accountingSettingsSchema),
    values: {
      fiscalYearStartMonth: accountingSettingsQuery.data?.fiscalYearStartMonth ?? undefined,
      fiscalYearStartDay: accountingSettingsQuery.data?.fiscalYearStartDay ?? undefined,
      accountingMethod: accountingSettingsQuery.data?.accountingMethod ?? "",
      defaultCurrencyCode: accountingSettingsQuery.data?.defaultCurrencyCode ?? "",
      accountCodeStrategy: accountingSettingsQuery.data?.accountCodeStrategy ?? "",
      accountHierarchyEnabled: accountingSettingsQuery.data?.accountHierarchyEnabled ?? true,
      allowManualJournalEntries: accountingSettingsQuery.data?.allowManualJournalEntries ?? true,
      lockDate: accountingSettingsQuery.data?.lockDate ?? "",
    },
  });

  if (!canView) {
    return (
      <ErrorState
        title="Accounting settings access restricted"
        description="Your current company membership does not include accounting settings visibility."
      />
    );
  }

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(async (values) => {
        await upsertMutation.mutateAsync({
          ...values,
          fiscalYearStartMonth: values.fiscalYearStartMonth ?? null,
          fiscalYearStartDay: values.fiscalYearStartDay ?? null,
          accountingMethod: values.accountingMethod || null,
          defaultCurrencyCode: values.defaultCurrencyCode || null,
          accountCodeStrategy: values.accountCodeStrategy || null,
          lockDate: values.lockDate || null,
        });
      })}
    >
      {accountingSettingsQuery.error ? (
        <ErrorState
          title="Unable to load accounting settings"
          description={accountingSettingsQuery.error.message}
        />
      ) : null}
      {upsertMutation.error ? <Alert title={upsertMutation.error.message} variant="destructive" /> : null}

      <SettingsSectionCard
        description="Configure accounting policy defaults and operational controls."
        title="Accounting Defaults"
      >
        <FieldGrid columns={2}>
          <FormField label="Fiscal year start month">
            <Input disabled={!canManage} {...form.register("fiscalYearStartMonth")} type="number" />
          </FormField>
          <FormField label="Fiscal year start day">
            <Input disabled={!canManage} {...form.register("fiscalYearStartDay")} type="number" />
          </FormField>
          <FormField label="Accounting method">
            <Select disabled={!canManage} {...form.register("accountingMethod")}>
              <option value="">Select method</option>
              <option value="accrual">Accrual</option>
              <option value="cash">Cash</option>
            </Select>
          </FormField>
          <FormField label="Default currency code">
            <Input disabled={!canManage} {...form.register("defaultCurrencyCode")} />
          </FormField>
          <FormField label="Account code strategy">
            <Input disabled={!canManage} {...form.register("accountCodeStrategy")} />
          </FormField>
          <FormField label="Lock date">
            <Input disabled={!canManage} {...form.register("lockDate")} type="date" />
          </FormField>
        </FieldGrid>
        <div className="mt-4 space-y-3 text-sm">
          <label className="flex items-center gap-2">
            <Checkbox
              checked={form.watch("accountHierarchyEnabled")}
              disabled={!canManage}
              onChange={(event) => form.setValue("accountHierarchyEnabled", event.target.checked)}
            />
            Account hierarchy enabled
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={form.watch("allowManualJournalEntries")}
              disabled={!canManage}
              onChange={(event) => form.setValue("allowManualJournalEntries", event.target.checked)}
            />
            Allow manual journal entries
          </label>
        </div>
      </SettingsSectionCard>

      <div className="flex justify-end">
        <Button disabled={!canManage} isLoading={upsertMutation.isPending} type="submit">
          Save accounting settings
        </Button>
      </div>
    </form>
  );
}

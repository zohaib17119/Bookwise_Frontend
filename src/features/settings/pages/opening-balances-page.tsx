import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldGrid } from "@/components/shared/field-grid";
import { FormField } from "@/components/shared/form-field";
import { SettingsSectionCard } from "@/components/settings/settings-section-card";
import { ErrorState } from "@/components/shared/error-state";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { canUsePermission } from "@/features/permissions/utils/module-permissions";
import {
  useOpeningBalances,
  useSaveOpeningBalances,
} from "@/features/settings/hooks/use-opening-balances";

type OpeningForm = {
  asOfDate: string;
  cash: string;
  bank: string;
  accountsReceivable: string;
  accountsPayable: string;
  inventory: string;
  purchaseTaxRecoverable: string;
  taxPayable: string;
};

export function OpeningBalancesPage() {
  const { companyId, permissions } = useActiveCompany();
  const canView = canUsePermission(permissions, ["accounting_settings.view", "settings.read", "settings.manage"]);
  const canManage = canUsePermission(permissions, ["accounting_settings.manage", "settings.manage"]);
  const query = useOpeningBalances(companyId);
  const saveMutation = useSaveOpeningBalances(companyId);
  const form = useForm<OpeningForm>({
    defaultValues: {
      asOfDate: new Date().toISOString().slice(0, 10),
      cash: "0.00",
      bank: "0.00",
      accountsReceivable: "0.00",
      accountsPayable: "0.00",
      inventory: "0.00",
      purchaseTaxRecoverable: "0.00",
      taxPayable: "0.00",
    },
  });

  useEffect(() => {
    if (!query.data) return;
    form.reset({
      asOfDate: query.data.asOfDate
        ? String(query.data.asOfDate).slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      cash: query.data.amounts.cash ?? "0.00",
      bank: query.data.amounts.bank ?? "0.00",
      accountsReceivable: query.data.amounts.accountsReceivable ?? "0.00",
      accountsPayable: query.data.amounts.accountsPayable ?? "0.00",
      inventory: query.data.amounts.inventory ?? "0.00",
      purchaseTaxRecoverable: query.data.amounts.purchaseTaxRecoverable ?? "0.00",
      taxPayable: query.data.amounts.taxPayable ?? "0.00",
    });
  }, [form, query.data]);

  if (!canView) {
    return (
      <ErrorState
        title="Opening balances access restricted"
        description="Your current company membership does not include accounting settings visibility."
      />
    );
  }

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(async (values) => {
        await saveMutation.mutateAsync(values);
      })}
    >
      {query.error ? (
        <ErrorState title="Unable to load opening balances" description={query.error.message} />
      ) : null}
      {saveMutation.error ? <Alert title={saveMutation.error.message} variant="destructive" /> : null}

      <SettingsSectionCard
        description="Enter starting cash, bank, receivables, payables, inventory (GL only), and tax balances as of your books start date. This posts one Opening Balance journal against Opening Balance Equity. It adds to current balances and does not change already posted invoices or bills."
        title="Opening balances"
      >
        <FieldGrid columns={2}>
          <FormField label="As of date">
            <Input disabled={!canManage} type="date" {...form.register("asOfDate")} />
          </FormField>
          <FormField label="Cash on hand">
            <Input disabled={!canManage} inputMode="decimal" {...form.register("cash")} />
          </FormField>
          <FormField label="Bank">
            <Input disabled={!canManage} inputMode="decimal" {...form.register("bank")} />
          </FormField>
          <FormField label="Accounts receivable">
            <Input disabled={!canManage} inputMode="decimal" {...form.register("accountsReceivable")} />
          </FormField>
          <FormField label="Accounts payable">
            <Input disabled={!canManage} inputMode="decimal" {...form.register("accountsPayable")} />
          </FormField>
          <FormField label="Inventory (ledger amount)">
            <Input disabled={!canManage} inputMode="decimal" {...form.register("inventory")} />
          </FormField>
          <FormField label="Purchase tax recoverable">
            <Input disabled={!canManage} inputMode="decimal" {...form.register("purchaseTaxRecoverable")} />
          </FormField>
          <FormField label="Tax payable">
            <Input disabled={!canManage} inputMode="decimal" {...form.register("taxPayable")} />
          </FormField>
        </FieldGrid>
        {query.data?.amounts.openingBalanceEquity ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Opening Balance Equity plug: {query.data.amounts.openingBalanceEquity}
          </p>
        ) : null}
      </SettingsSectionCard>

      <div className="flex justify-end">
        <Button disabled={!canManage} isLoading={saveMutation.isPending} type="submit">
          Save opening balances
        </Button>
      </div>
    </form>
  );
}

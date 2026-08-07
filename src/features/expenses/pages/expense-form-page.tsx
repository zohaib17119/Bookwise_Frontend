import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CounterpartySelect } from "@/components/documents/counterparty-select";
import { FieldGrid } from "@/components/shared/field-grid";
import { FormField } from "@/components/shared/form-field";
import { FormSection } from "@/components/shared/form-section";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { useAccountOptions } from "@/features/accounts/hooks/use-accounts";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { getCompanyBaseCurrency } from "@/features/companies/utils/company-currency";
import { useCreateExpense } from "@/features/expenses/hooks/use-expenses";
import {
  expenseSchema,
  type ExpenseFormInput,
  type ExpenseFormValues,
} from "@/features/expenses/schemas/expense.schema";
import { canManageEntity } from "@/features/permissions/utils/module-permissions";
import { useVendorOptions } from "@/features/vendors/hooks/use-vendors";
import { formatCurrency } from "@/lib/utils/format";
import { toMoneyString } from "@/lib/utils/money";

export function ExpenseFormPage() {
  const navigate = useNavigate();
  const { companyId, company, permissions } = useActiveCompany();
  const accountsQuery = useAccountOptions(companyId);
  const vendorsQuery = useVendorOptions(companyId);
  const createMutation = useCreateExpense(companyId);
  const canManage = canManageEntity(permissions, "expenses");
  const displayCurrency = getCompanyBaseCurrency(company);

  const bankAccounts = useMemo(
    () => (accountsQuery.data ?? []).filter((account) => account.type === "BANK" && account.isActive),
    [accountsQuery.data],
  );

  const expenseAccounts = useMemo(
    () =>
      (accountsQuery.data ?? []).filter(
        (account) =>
          (account.type === "EXPENSE" || account.type === "COST_OF_GOODS_SOLD") && account.isActive,
      ),
    [accountsQuery.data],
  );

  const form = useForm<ExpenseFormInput, undefined, ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentAccountId: "",
      expenseAccountId: "",
      vendorId: "",
      amount: "",
      description: "",
      referenceNumber: "",
    },
  });
  const watchedAmount = form.watch("amount");

  if (!canManage) {
    return (
      <Alert
        description="Your current company membership does not include expense management."
        title="Expenses are unavailable"
        variant="destructive"
      />
    );
  }

  return (
    <PageContainer
      header={
        <PageHeader
          actions={
            <Button asChild variant="ghost">
              <Link to={`/app/company/${companyId}/expenses`}>Back to expenses</Link>
            </Button>
          }
          description="Record a direct cash or bank expense. The journal entry posts immediately."
          eyebrow="Purchases"
          title="Record expense"
        />
      }
    >
      <form
        className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"
        onSubmit={form.handleSubmit(async (values) => {
          const expense = await createMutation.mutateAsync({
            paymentDate: values.paymentDate,
            paymentAccountId: values.paymentAccountId,
            expenseAccountId: values.expenseAccountId,
            vendorId: values.vendorId || undefined,
            amount: values.amount,
            currencyCode: displayCurrency,
            description: values.description,
            referenceNumber: values.referenceNumber || undefined,
          });

          navigate(`/app/company/${companyId}/expenses/${expense.id}`);
        })}
      >
        <div className="space-y-6">
          {createMutation.error ? <Alert title={createMutation.error.message} variant="destructive" /> : null}

          <FormSection title="Expense details">
            <FieldGrid>
              <FormField label="Payment date" error={form.formState.errors.paymentDate?.message}>
                <Input type="date" {...form.register("paymentDate")} />
              </FormField>
              <FormField label="Pay from" error={form.formState.errors.paymentAccountId?.message}>
                <Select {...form.register("paymentAccountId")}>
                  <option value="">Select bank account</option>
                  {bankAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.code ? `${account.code} — ` : ""}
                      {account.name}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Category" error={form.formState.errors.expenseAccountId?.message}>
                <Select {...form.register("expenseAccountId")}>
                  <option value="">Select expense account</option>
                  {expenseAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.code ? `${account.code} — ` : ""}
                      {account.name}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Amount" error={form.formState.errors.amount?.message}>
                <Input step="0.01" type="number" {...form.register("amount")} />
              </FormField>
              <FormField label="Reference number">
                <Input {...form.register("referenceNumber")} placeholder="Check or receipt number" />
              </FormField>
            </FieldGrid>

            <CounterpartySelect
              error={form.formState.errors.vendorId?.message}
              label="Vendor (optional)"
              onChange={(value) => form.setValue("vendorId", value)}
              options={(vendorsQuery.data ?? []).map((vendor) => ({
                id: vendor.id,
                label: vendor.displayName,
                secondary: vendor.vendorCode ?? undefined,
              }))}
              placeholder="Select vendor"
              value={form.watch("vendorId") ?? ""}
            />

            <FormField label="Description" error={form.formState.errors.description?.message}>
              <Input {...form.register("description")} placeholder="What was this expense for?" />
            </FormField>
          </FormSection>
        </div>

        <div className="space-y-4">
          <div className="surface p-5">
            <p className="text-sm text-muted-foreground">Amount preview</p>
            <p className="mt-3 text-2xl font-semibold">
              {formatCurrency(toMoneyString(watchedAmount), displayCurrency)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Posts immediately: debit expense category, credit payment account.
            </p>
          </div>
          <Button className="w-full" isLoading={createMutation.isPending} type="submit">
            Record expense
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}

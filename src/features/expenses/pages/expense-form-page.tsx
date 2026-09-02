import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FieldGrid } from "@/components/shared/field-grid";
import { FormField } from "@/components/shared/form-field";
import { FormSection } from "@/components/shared/form-section";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { useAccountOptions } from "@/features/accounts/hooks/use-accounts";
import { buildPayFromOptions } from "@/features/accounts/utils/payment-account-options";
import { useBankAccounts } from "@/features/banking/hooks/use-banking";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { getCompanyBaseCurrency } from "@/features/companies/utils/company-currency";
import { ExpenseCategorySelect } from "@/features/expenses/components/expense-category-select";
import { useCreateExpense } from "@/features/expenses/hooks/use-expenses";
import {
  expenseSchema,
  type ExpenseFormInput,
  type ExpenseFormValues,
} from "@/features/expenses/schemas/expense.schema";
import { canManageEntity } from "@/features/permissions/utils/module-permissions";
import { useDefaultAccountMapping } from "@/features/settings/hooks/use-default-account-mapping";
import { formatCurrency } from "@/lib/utils/format";
import { toMoneyString } from "@/lib/utils/money";

export function ExpenseFormPage() {
  const navigate = useNavigate();
  const { companyId, company, permissions } = useActiveCompany();
  const accountsQuery = useAccountOptions(companyId);
  const bankAccountsQuery = useBankAccounts(companyId);
  const mappingQuery = useDefaultAccountMapping(companyId);
  const createMutation = useCreateExpense(companyId);
  const canManage = canManageEntity(permissions, "expenses");
  const displayCurrency = getCompanyBaseCurrency(company);

  const form = useForm<ExpenseFormInput, undefined, ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentAccountId: "",
      expenseAccountId: "",
      amount: "",
      description: "",
      referenceNumber: "",
    },
  });

  const payFromOptions = useMemo(
    () => buildPayFromOptions(accountsQuery.data ?? [], bankAccountsQuery.data ?? []),
    [accountsQuery.data, bankAccountsQuery.data],
  );
  const defaultPayFrom =
    mappingQuery.data?.defaultExpensePayment?.accountId || mappingQuery.data?.cashBank?.accountId || "";
  useEffect(() => {
    if (!defaultPayFrom || form.getValues("paymentAccountId")) return;
    form.setValue("paymentAccountId", defaultPayFrom);
  }, [defaultPayFrom, form]);

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
                  <option value="">Select cash or bank account</option>
                  {payFromOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Category" error={form.formState.errors.expenseAccountId?.message}>
                <ExpenseCategorySelect
                  accounts={accountsQuery.data ?? []}
                  companyId={companyId}
                  onChange={(accountId) => form.setValue("expenseAccountId", accountId)}
                  value={form.watch("expenseAccountId")}
                />
              </FormField>
              <FormField label="Amount" error={form.formState.errors.amount?.message}>
                <Input step="0.01" type="number" {...form.register("amount")} />
              </FormField>
              <FormField label="Reference number">
                <Input {...form.register("referenceNumber")} placeholder="Check or receipt number" />
              </FormField>
            </FieldGrid>

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

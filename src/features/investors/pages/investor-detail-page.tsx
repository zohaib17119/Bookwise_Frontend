import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { FieldGrid } from "@/components/shared/field-grid";
import { FormField } from "@/components/shared/form-field";
import { FormSection } from "@/components/shared/form-section";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { useAccountOptions } from "@/features/accounts/hooks/use-accounts";
import { isCashLikeAccount } from "@/features/accounts/utils/cash-like";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import {
  useCreateInvestorInvestment,
  useInvestor,
  useInvestorInvestments,
} from "@/features/investors/hooks/use-investors";
import {
  investmentFormSchema,
  type InvestmentFormValues,
} from "@/features/investors/schemas/investor.schema";
import type { InvestorInvestment } from "@/features/investors/types/investor.types";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import { useDefaultAccountMapping } from "@/features/settings/hooks/use-default-account-mapping";
import { getApiErrorMessage } from "@/lib/api/error";
import { formatCurrency, formatDate } from "@/lib/utils/format";

function todayIsoDate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function InvestorDetailPage() {
  const { companyId, investorId } = useParams();
  const { currency, permissions } = useActiveCompany();
  const [page, setPage] = useState(1);
  const [formError, setFormError] = useState<string | null>(null);
  const canView = canViewEntity(permissions, "investors");
  const canManage = canManageEntity(permissions, "investors");
  const investorQuery = useInvestor(companyId, investorId ?? null);
  const investmentsQuery = useInvestorInvestments(companyId, investorId ?? null, {
    page,
    limit: 25,
  });
  const createMutation = useCreateInvestorInvestment(companyId, investorId ?? null);
  const accountsQuery = useAccountOptions(companyId);
  const mappingQuery = useDefaultAccountMapping(companyId);
  const cashAccounts = useMemo(
    () => (accountsQuery.data ?? []).filter((account) => account.isActive && isCashLikeAccount(account)),
    [accountsQuery.data],
  );
  const form = useForm<InvestmentFormValues>({
    resolver: zodResolver(investmentFormSchema),
    defaultValues: {
      investmentDate: todayIsoDate(),
      amount: "",
      paymentAccountId: "",
      notes: "",
    },
  });

  useEffect(() => {
    const defaultReceive =
      mappingQuery.data?.defaultCustomerReceive?.accountId ||
      mappingQuery.data?.cashBank?.accountId ||
      "";
    if (!defaultReceive || form.getValues("paymentAccountId")) return;
    if (cashAccounts.some((account) => account.id === defaultReceive)) {
      form.setValue("paymentAccountId", defaultReceive);
    }
  }, [mappingQuery.data, cashAccounts, form]);

  if (!canView) {
    return (
      <ErrorState
        title="Investors access restricted"
        description="Your current company membership does not include investor access."
      />
    );
  }

  if (investorQuery.isLoading) {
    return (
      <PageContainer>
        <div className="surface p-6">Loading investor...</div>
      </PageContainer>
    );
  }

  if (investorQuery.error || !investorQuery.data) {
    return (
      <ErrorState
        title="Investor not found"
        description={investorQuery.error?.message ?? "The requested investor is unavailable."}
      />
    );
  }

  const investor = investorQuery.data;
  const columns: DataTableColumn<InvestorInvestment>[] = [
    {
      key: "date",
      header: "Date",
      render: (row) => formatDate(row.investmentDate),
    },
    {
      key: "amount",
      header: "Amount",
      render: (row) => formatCurrency(row.amount, row.currencyCode || currency),
    },
    {
      key: "account",
      header: "Cash / Bank",
      render: (row) =>
        row.paymentAccount
          ? `${row.paymentAccount.code} ${row.paymentAccount.name}`
          : row.paymentAccountId,
    },
    {
      key: "equity",
      header: "Equity",
      render: (row) =>
        row.equityAccount
          ? `${row.equityAccount.code} ${row.equityAccount.name}`
          : "Owner's Equity",
    },
    {
      key: "notes",
      header: "Notes",
      render: (row) => row.notes || "—",
    },
  ];

  const onSubmit = async (values: InvestmentFormValues) => {
    setFormError(null);
    try {
      await createMutation.mutateAsync({
        investmentDate: values.investmentDate,
        amount: values.amount,
        paymentAccountId: values.paymentAccountId,
        notes: values.notes?.trim() || undefined,
      });
      form.reset({
        investmentDate: todayIsoDate(),
        amount: "",
        paymentAccountId: values.paymentAccountId,
        notes: "",
      });
    } catch (err) {
      setFormError(getApiErrorMessage(err));
    }
  };

  return (
    <PageContainer
      header={
        <PageHeader
          actions={
            <Button asChild variant="ghost">
              <Link to={`/app/company/${companyId}/investors`}>Back to investors</Link>
            </Button>
          }
          description={`Total invested ${formatCurrency(investor.totalInvested, currency)} · ${investor.investmentCount} investment${investor.investmentCount === 1 ? "" : "s"}`}
          title={`${investor.code ? `${investor.code} — ` : ""}${investor.name}`}
        />
      }
    >
      {canManage ? (
        <div className="surface mb-6 p-6">
          <FormSection
            description="Posts Dr Cash/Bank and Cr Owner's Equity (3000)."
            title="Add investment"
          >
            {formError ? (
              <Alert description={formError} title="Could not save" variant="destructive" />
            ) : null}
            <FieldGrid>
              <FormField label="Date" error={form.formState.errors.investmentDate?.message}>
                <Input type="date" {...form.register("investmentDate")} />
              </FormField>
              <FormField label="Amount" error={form.formState.errors.amount?.message}>
                <Input step="0.01" type="number" {...form.register("amount")} />
              </FormField>
              <FormField
                label="Deposit to (Cash / Bank)"
                error={form.formState.errors.paymentAccountId?.message}
              >
                <Select {...form.register("paymentAccountId")}>
                  <option value="">Select account</option>
                  {cashAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {(account.code ? `${account.code} ` : "") + account.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            </FieldGrid>
            <FormField label="Notes">
              <Textarea {...form.register("notes")} placeholder="Optional note" />
            </FormField>
            <Button
              className="mt-2"
              isLoading={createMutation.isPending}
              onClick={form.handleSubmit(onSubmit)}
              type="button"
            >
              Record investment
            </Button>
          </FormSection>
        </div>
      ) : null}

      <div className="surface p-6">
        <FormSection description="Newest first." title="Investment history">
          <DataTable
            columns={columns}
            data={investmentsQuery.data?.items ?? []}
            emptyDescription="Record an investment above to post cash/bank and equity."
            emptyTitle="No investments yet"
            getRowKey={(row) => row.id}
            isLoading={investmentsQuery.isLoading}
            pagination={
              investmentsQuery.data
                ? {
                    page: investmentsQuery.data.pagination.page,
                    totalPages: investmentsQuery.data.pagination.totalPages,
                    total: investmentsQuery.data.pagination.total,
                    limit: investmentsQuery.data.pagination.limit,
                    onPageChange: setPage,
                  }
                : undefined
            }
          />
        </FormSection>
      </div>
    </PageContainer>
  );
}

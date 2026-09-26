import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CreateEditDrawer } from "@/components/shared/create-edit-drawer";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { FieldGrid } from "@/components/shared/field-grid";
import { FormField } from "@/components/shared/form-field";
import { FormSection } from "@/components/shared/form-section";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { TableActions } from "@/components/shared/table-actions";
import { useAccountOptions } from "@/features/accounts/hooks/use-accounts";
import { isCashLikeAccount } from "@/features/accounts/utils/cash-like";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import {
  useCreateInvestorInvestment,
  useInvestor,
  useInvestorInvestments,
  useUpdateInvestorInvestment,
} from "@/features/investors/hooks/use-investors";
import {
  investmentEditFormSchema,
  investmentFormSchema,
  type InvestmentEditFormValues,
  type InvestmentFormValues,
} from "@/features/investors/schemas/investor.schema";
import type { InvestorInvestment } from "@/features/investors/types/investor.types";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import { useDefaultAccountMapping } from "@/features/settings/hooks/use-default-account-mapping";
import { getApiErrorMessage } from "@/lib/api/error";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

function todayIsoDate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function toInputDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return todayIsoDate();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

export function InvestorDetailPage() {
  const { companyId, investorId } = useParams();
  const { currency, permissions } = useActiveCompany();
  const [page, setPage] = useState(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<InvestorInvestment | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const canView = canViewEntity(permissions, "investors");
  const canManage = canManageEntity(permissions, "investors");
  const investorQuery = useInvestor(companyId, investorId ?? null);
  const investmentsQuery = useInvestorInvestments(companyId, investorId ?? null, {
    page,
    limit: 25,
  });
  const createMutation = useCreateInvestorInvestment(companyId, investorId ?? null);
  const updateMutation = useUpdateInvestorInvestment(companyId, investorId ?? null);
  const accountsQuery = useAccountOptions(companyId);
  const mappingQuery = useDefaultAccountMapping(companyId);
  const cashAccounts = useMemo(
    () => (accountsQuery.data ?? []).filter((account) => account.isActive && isCashLikeAccount(account)),
    [accountsQuery.data],
  );
  const form = useForm<InvestmentFormValues>({
    resolver: zodResolver(investmentFormSchema),
    defaultValues: {
      movementType: "CONTRIBUTION",
      investmentDate: todayIsoDate(),
      amount: "",
      paymentAccountId: "",
      notes: "",
    },
  });
  const editForm = useForm<InvestmentEditFormValues>({
    resolver: zodResolver(investmentEditFormSchema),
    defaultValues: {
      movementType: "CONTRIBUTION",
      investmentDate: todayIsoDate(),
      amount: "",
      paymentAccountId: "",
      notes: "",
      updateReason: "",
    },
  });
  const movementType = useWatch({ control: form.control, name: "movementType" });
  const isWithdrawal = movementType === "WITHDRAWAL";
  const editMovementType = useWatch({ control: editForm.control, name: "movementType" });
  const editIsWithdrawal = editMovementType === "WITHDRAWAL";

  useEffect(() => {
    const defaultAccount = isWithdrawal
      ? mappingQuery.data?.defaultVendorPay?.accountId ||
        mappingQuery.data?.cashBank?.accountId ||
        ""
      : mappingQuery.data?.defaultCustomerReceive?.accountId ||
        mappingQuery.data?.cashBank?.accountId ||
        "";
    if (!defaultAccount) return;
    if (!form.getValues("paymentAccountId") && cashAccounts.some((a) => a.id === defaultAccount)) {
      form.setValue("paymentAccountId", defaultAccount);
    }
  }, [mappingQuery.data, cashAccounts, form, isWithdrawal]);

  useEffect(() => {
    if (!editTarget) return;
    editForm.reset({
      movementType: editTarget.movementType === "WITHDRAWAL" ? "WITHDRAWAL" : "CONTRIBUTION",
      investmentDate: toInputDate(editTarget.investmentDate),
      amount: String(editTarget.amount),
      paymentAccountId: editTarget.paymentAccountId,
      notes: editTarget.notes ?? "",
      updateReason: "",
    });
    setEditError(null);
  }, [editTarget, editForm]);

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
      key: "type",
      header: "Type",
      render: (row) => (row.movementType === "WITHDRAWAL" ? "Withdraw" : "Add"),
    },
    {
      key: "amount",
      header: "Amount",
      render: (row) => (
        <span className={cn(row.movementType === "WITHDRAWAL" && "text-muted-foreground")}>
          {row.movementType === "WITHDRAWAL" ? "−" : ""}
          {formatCurrency(row.amount, row.currencyCode || currency)}
        </span>
      ),
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
      render: (row) =>
        row.lastUpdateReason ? (
          <div>
            <p>{row.notes || "—"}</p>
            <p className="text-xs text-muted-foreground">Edited: {row.lastUpdateReason}</p>
          </div>
        ) : (
          row.notes || "—"
        ),
    },
    {
      key: "actions",
      header: "",
      render: (row) =>
        canManage ? <TableActions onEdit={() => setEditTarget(row)} /> : null,
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
        movementType: values.movementType,
      });
      form.reset({
        movementType: values.movementType,
        investmentDate: todayIsoDate(),
        amount: "",
        paymentAccountId: values.paymentAccountId,
        notes: "",
      });
    } catch (err) {
      setFormError(getApiErrorMessage(err));
    }
  };

  const onEditSubmit = async (values: InvestmentEditFormValues) => {
    if (!editTarget) return;
    setEditError(null);
    try {
      await updateMutation.mutateAsync({
        investmentId: editTarget.id,
        payload: {
          updateReason: values.updateReason.trim(),
          investmentDate: values.investmentDate,
          amount: values.amount,
          paymentAccountId: values.paymentAccountId,
          notes: values.notes?.trim() || null,
          movementType: values.movementType,
        },
      });
      setEditTarget(null);
    } catch (err) {
      setEditError(getApiErrorMessage(err));
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
          description={`Total invested ${formatCurrency(investor.totalInvested, currency)} · Total withdrawn ${formatCurrency(investor.totalWithdrawn ?? "0", currency)} · Net invested ${formatCurrency(investor.netInvested ?? investor.totalInvested, currency)} · ${investor.investmentCount} record${investor.investmentCount === 1 ? "" : "s"}`}
          title={`${investor.code ? `${investor.code} — ` : ""}${investor.name}`}
        />
      }
    >
      {canManage ? (
        <div className="surface mb-6 p-6">
          <FormSection
            description={
              isWithdrawal
                ? "Posts Dr Owner's Equity and Cr Cash/Bank — cash leaves the selected account."
                : "Posts Dr Cash/Bank and Cr Owner's Equity (3000)."
            }
            title={isWithdrawal ? "Record withdrawal" : "Add investment"}
          >
            {formError ? (
              <Alert description={formError} title="Could not save" variant="destructive" />
            ) : null}
            <FieldGrid>
              <FormField label="Type" error={form.formState.errors.movementType?.message}>
                <Select {...form.register("movementType")}>
                  <option value="CONTRIBUTION">Add investment</option>
                  <option value="WITHDRAWAL">Withdraw</option>
                </Select>
              </FormField>
              <FormField label="Date" error={form.formState.errors.investmentDate?.message}>
                <Input type="date" {...form.register("investmentDate")} />
              </FormField>
              <FormField label="Amount" error={form.formState.errors.amount?.message}>
                <Input step="0.01" type="number" {...form.register("amount")} />
              </FormField>
              <FormField
                label={isWithdrawal ? "Pay from (Cash / Bank)" : "Deposit to (Cash / Bank)"}
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
              {isWithdrawal ? "Record withdrawal" : "Record investment"}
            </Button>
          </FormSection>
        </div>
      ) : null}

      <div className="surface p-6">
        <FormSection description="Newest first. Add and withdraw records." title="Investment history">
          <DataTable
            columns={columns}
            data={investmentsQuery.data?.items ?? []}
            emptyDescription="Record an investment or withdrawal above."
            emptyTitle="No movements yet"
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

      <CreateEditDrawer
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title="Edit investment"
        description="Reverses the old journal and posts again — amount and Cash/Bank both update the ledger."
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setEditTarget(null)} type="button" variant="ghost">
              Cancel
            </Button>
            <Button
              isLoading={updateMutation.isPending}
              onClick={editForm.handleSubmit(onEditSubmit)}
              type="button"
            >
              Save changes
            </Button>
          </div>
        }
      >
        {editError ? (
          <Alert className="mb-4" description={editError} title="Could not update" variant="destructive" />
        ) : null}
        <FieldGrid>
          <FormField label="Type" error={editForm.formState.errors.movementType?.message}>
            <Select {...editForm.register("movementType")}>
              <option value="CONTRIBUTION">Add investment</option>
              <option value="WITHDRAWAL">Withdraw</option>
            </Select>
          </FormField>
          <FormField label="Date" error={editForm.formState.errors.investmentDate?.message}>
            <Input type="date" {...editForm.register("investmentDate")} />
          </FormField>
          <FormField label="Amount" error={editForm.formState.errors.amount?.message}>
            <Input step="0.01" type="number" {...editForm.register("amount")} />
          </FormField>
          <FormField
            label={editIsWithdrawal ? "Pay from (Cash / Bank)" : "Deposit to (Cash / Bank)"}
            error={editForm.formState.errors.paymentAccountId?.message}
          >
            <Select {...editForm.register("paymentAccountId")}>
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
          <Textarea {...editForm.register("notes")} placeholder="Optional note" />
        </FormField>
        <FormField
          label="Update reason"
          error={editForm.formState.errors.updateReason?.message}
        >
          <Textarea
            {...editForm.register("updateReason")}
            placeholder="Why are you changing this record?"
          />
        </FormField>
      </CreateEditDrawer>
    </PageContainer>
  );
}

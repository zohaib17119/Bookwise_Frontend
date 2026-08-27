import { useMemo, useState } from "react";
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
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { getCompanyBaseCurrency } from "@/features/companies/utils/company-currency";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import { FieldHint } from "@/components/shared/field-hint";
import { taxBalanceHint } from "@/features/shared/utils/wht-labels";
import { TaxModuleNav } from "@/features/tax/components/tax-module-nav";
import {
  useCreateTaxPayment,
  useTaxBalances,
  useTaxPayments,
} from "@/features/tax/hooks/use-tax";
import type {
  TaxAccountBalanceDetail,
  TaxPayment,
  TaxPaymentBucket,
  TaxPaymentDirection,
  TaxPaymentFundingSource,
} from "@/features/tax/types/tax.types";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { toMoneyDecimalString } from "@/features/shared/utils/decimal-string";

const ROLE_LABEL: Record<string, string> = {
  VAT_PAYABLE: "VAT / Sales tax payable",
  VAT_RECEIVABLE: "VAT recoverable (receivable)",
  SALES_TAX_WHT_PAYABLE: "Sales tax WHT payable",
  SALES_TAX_WHT_RECEIVABLE: "Sales tax WHT receivable",
  INCOME_WHT_PAYABLE: "Income WHT payable",
  INCOME_WHT_RECEIVABLE: "Income WHT receivable",
};

function bucketForRole(role: string): TaxPaymentBucket | null {
  if (role.startsWith("VAT_")) return "VAT";
  if (role.startsWith("SALES_TAX_WHT_")) return "SALES_TAX_WHT";
  if (role.startsWith("INCOME_WHT_")) return "INCOME_WHT";
  return null;
}

export function TaxPaymentPage() {
  const { companyId, company, permissions } = useActiveCompany();
  const canView = canViewEntity(permissions, "tax");
  const canManage = canManageEntity(permissions, "tax");
  const balancesQuery = useTaxBalances(companyId);
  const paymentsQuery = useTaxPayments(companyId);
  const accountsQuery = useAccountOptions(companyId);
  const createMutation = useCreateTaxPayment(companyId);
  const currency = getCompanyBaseCurrency(company);

  const [direction, setDirection] = useState<TaxPaymentDirection>("PAY");
  const [accountId, setAccountId] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [fundingSource, setFundingSource] = useState<TaxPaymentFundingSource>("CASH");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [memo, setMemo] = useState("");

  const bankAccounts = useMemo(
    () =>
      (accountsQuery.data ?? []).filter(
        (account) =>
          account.type === "BANK" ||
          (account.type === "ASSET" && (account.subtype ?? "").toLowerCase() === "cash"),
      ),
    [accountsQuery.data],
  );

  const selectableDetails = useMemo(() => {
    const detail = balancesQuery.data?.detail ?? [];
    return detail.filter((row) =>
      direction === "PAY" ? row.side === "PAYABLE" : row.side === "RECEIVABLE",
    );
  }, [balancesQuery.data?.detail, direction]);

  const selectedDetail = selectableDetails.find((row) => row.accountId === accountId);
  const selectedBucket = selectedDetail ? bucketForRole(selectedDetail.role) : null;
  const isVatCollect = selectedBucket === "VAT" && direction === "COLLECT";
  const isVatPay = selectedBucket === "VAT" && direction === "PAY";
  const effectiveFunding: TaxPaymentFundingSource = isVatCollect
    ? "CARRY_FORWARD"
    : isVatPay
      ? fundingSource
      : "CASH";
  const needsBankAccount = effectiveFunding === "CASH";
  const carryForwardBalance = balancesQuery.data?.salesTaxCarryForward ?? "0";

  const historyColumns: DataTableColumn<TaxPayment>[] = [
    {
      key: "paymentDate",
      header: "Date",
      render: (row) => formatDate(row.paymentDate),
    },
    {
      key: "direction",
      header: "Type",
      render: (row) => {
        if (row.bucket === "VAT" && row.direction === "COLLECT") return "To carry forward";
        if (row.fundingSource === "CARRY_FORWARD") return "Paid (carry forward)";
        return row.direction === "PAY" ? "Paid" : "Collected";
      },
    },
    {
      key: "bucket",
      header: "Bucket",
      render: (row) =>
        row.bucket === "VAT"
          ? "VAT"
          : row.bucket === "SALES_TAX_WHT"
            ? "Sales tax WHT"
            : "Income WHT",
    },
    {
      key: "amount",
      header: "Amount",
      className: "text-right",
      render: (row) => (
        <span className="tabular-nums">{formatCurrency(row.amount, currency)}</span>
      ),
    },
    {
      key: "memo",
      header: "Memo",
      render: (row) => row.memo || "—",
    },
  ];

  const detailColumns: DataTableColumn<TaxAccountBalanceDetail>[] = [
    {
      key: "role",
      header: "Balance",
      render: (row) => (
        <div>
          <p className="font-medium">{ROLE_LABEL[row.role] ?? row.role}</p>
          <p className="text-xs text-muted-foreground">
            {row.code} · {row.name}
          </p>
        </div>
      ),
    },
    {
      key: "side",
      header: "Side",
      render: (row) => row.side,
    },
    {
      key: "balance",
      header: "Open balance",
      className: "text-right",
      render: (row) => (
        <span className="tabular-nums">{formatCurrency(row.balance, currency)}</span>
      ),
    },
  ];

  if (!canView) {
    return (
      <ErrorState
        description="Your current company membership does not include tax visibility."
        title="Tax access restricted"
      />
    );
  }

  const totals = balancesQuery.data;

  return (
    <PageContainer
      header={
        <PageHeader
          description="Pay tax authority liabilities or move VAT recoverable into carry forward. Cash/bank settles WHT and optional VAT payments."
          eyebrow="Tax"
          title="Tax payments"
        />
      }
    >
      <TaxModuleNav />

      {balancesQuery.error ? (
        <ErrorState description={balancesQuery.error.message} title="Unable to load tax balances" />
      ) : null}

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-white p-4 shadow-sm">
          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            Sales tax / VAT payable
            <FieldHint text={taxBalanceHint("payable", "vat")} />
          </p>
          <p className="mt-2 text-xl font-semibold tabular-nums">
            {formatCurrency(totals?.salesTaxPayable ?? 0, currency)}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-white p-4 shadow-sm">
          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            Sales tax / VAT receivable
            <FieldHint text={taxBalanceHint("receivable", "vat")} />
          </p>
          <p className="mt-2 text-xl font-semibold tabular-nums">
            {formatCurrency(totals?.salesTaxReceivable ?? 0, currency)}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-white p-4 shadow-sm">
          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            Sales tax carry forward
            <FieldHint text="VAT recoverable moved here when collected. Apply against sales tax payable instead of cash." />
          </p>
          <p className="mt-2 text-xl font-semibold tabular-nums">
            {formatCurrency(totals?.salesTaxCarryForward ?? 0, currency)}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-white p-4 shadow-sm">
          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            Sales tax WHT payable
            <FieldHint text={taxBalanceHint("payable", "salesTaxWht")} />
          </p>
          <p className="mt-2 text-xl font-semibold tabular-nums">
            {formatCurrency(totals?.salesTaxWhtPayable ?? 0, currency)}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-white p-4 shadow-sm">
          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            Sales tax WHT receivable
            <FieldHint text={taxBalanceHint("receivable", "salesTaxWht")} />
          </p>
          <p className="mt-2 text-xl font-semibold tabular-nums">
            {formatCurrency(totals?.salesTaxWhtReceivable ?? 0, currency)}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-white p-4 shadow-sm">
          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            Income WHT payable
            <FieldHint text={taxBalanceHint("payable", "incomeWht")} />
          </p>
          <p className="mt-2 text-xl font-semibold tabular-nums">
            {formatCurrency(totals?.incomeWhtPayable ?? 0, currency)}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-white p-4 shadow-sm">
          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            Income WHT receivable
            <FieldHint text={taxBalanceHint("receivable", "incomeWht")} />
          </p>
          <p className="mt-2 text-xl font-semibold tabular-nums">
            {formatCurrency(totals?.incomeWhtReceivable ?? 0, currency)}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-white p-4 shadow-sm">
          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            Income WHT claimed
            <FieldHint text="Customer-held income WHT claimed from the authority (moved out of receivable)." />
          </p>
          <p className="mt-2 text-xl font-semibold tabular-nums">
            {formatCurrency(totals?.incomeWhtClaimed ?? 0, currency)}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <FormSection title="Account balances">
            <DataTable
              columns={detailColumns}
              data={totals?.detail ?? []}
              emptyDescription="No tax posting accounts found."
              emptyTitle="No balances"
              getRowKey={(row) => row.accountId}
              isLoading={balancesQuery.isLoading}
            />
          </FormSection>

          <FormSection title="Payment history">
            <DataTable
              columns={historyColumns}
              data={paymentsQuery.data ?? []}
              emptyDescription="Record a tax payment or collection to see history here."
              emptyTitle="No tax payments yet"
              getRowKey={(row) => row.id}
              isLoading={paymentsQuery.isLoading}
            />
          </FormSection>
        </div>

        <div className="space-y-4">
          <FormSection
            title={
              isVatCollect
                ? "Move to carry forward"
                : direction === "PAY"
                  ? "Pay tax"
                  : "Collect tax receivable"
            }
          >
            {!canManage ? (
              <Alert
                title="Tax manage permission required"
                description="You can view balances but cannot post tax payments."
                variant="destructive"
              />
            ) : null}
            {createMutation.error ? (
              <Alert title={createMutation.error.message} variant="destructive" />
            ) : null}
            <FieldGrid>
              <FormField label="Direction">
                <Select
                  disabled={!canManage}
                  onChange={(event) => {
                    setDirection(event.target.value as TaxPaymentDirection);
                    setAccountId("");
                    setFundingSource("CASH");
                  }}
                  value={direction}
                >
                  <option value="PAY">Pay payable</option>
                  <option value="COLLECT">Collect receivable</option>
                </Select>
              </FormField>
              <FormField label="Tax balance">
                <Select
                  disabled={!canManage}
                  onChange={(event) => {
                    setAccountId(event.target.value);
                    setFundingSource("CASH");
                  }}
                  value={accountId}
                >
                  <option value="">Select balance</option>
                  {selectableDetails.map((row) => (
                    <option key={row.accountId} value={row.accountId}>
                      {ROLE_LABEL[row.role] ?? row.name} —{" "}
                      {formatCurrency(row.balance, currency)}
                    </option>
                  ))}
                </Select>
              </FormField>
              {isVatCollect ? (
                <p className="text-sm text-muted-foreground md:col-span-2">
                  Moves VAT recoverable into sales tax carry forward. Cash balance does not change.
                </p>
              ) : null}
              {isVatPay ? (
                <FormField label="Pay from">
                  <Select
                    disabled={!canManage}
                    onChange={(event) =>
                      setFundingSource(event.target.value as TaxPaymentFundingSource)
                    }
                    value={fundingSource}
                  >
                    <option value="CASH">Cash / bank</option>
                    <option value="CARRY_FORWARD">
                      Carry forward ({formatCurrency(carryForwardBalance, currency)})
                    </option>
                  </Select>
                </FormField>
              ) : null}
              {needsBankAccount ? (
                <FormField label="Bank / cash account">
                  <Select
                    disabled={!canManage}
                    onChange={(event) => setBankAccountId(event.target.value)}
                    value={bankAccountId}
                  >
                    <option value="">Select account</option>
                    {bankAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.code} · {account.name}
                      </option>
                    ))}
                  </Select>
                </FormField>
              ) : null}
              <FormField label="Amount">
                <Input
                  disabled={!canManage}
                  max={selectedDetail ? Number(selectedDetail.balance) : undefined}
                  min="0"
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  type="number"
                  value={amount}
                />
              </FormField>
              <FormField label="Payment date">
                <Input
                  disabled={!canManage}
                  onChange={(event) => setPaymentDate(event.target.value)}
                  type="date"
                  value={paymentDate}
                />
              </FormField>
              <FormField label="Memo">
                <Textarea
                  disabled={!canManage}
                  onChange={(event) => setMemo(event.target.value)}
                  placeholder="Optional note"
                  value={memo}
                />
              </FormField>
            </FieldGrid>
            <Button
              className="mt-4 w-full"
              disabled={!canManage || createMutation.isPending}
              isLoading={createMutation.isPending}
              onClick={async () => {
                if (!accountId || !selectedDetail || !selectedBucket) return;
                if (needsBankAccount && !bankAccountId) return;
                await createMutation.mutateAsync({
                  direction,
                  bucket: selectedBucket,
                  accountId,
                  ...(needsBankAccount ? { bankAccountId } : {}),
                  fundingSource: effectiveFunding,
                  amount: toMoneyDecimalString(amount) || amount,
                  paymentDate,
                  memo: memo || undefined,
                });
                setAmount("");
                setMemo("");
              }}
              type="button"
            >
              {isVatCollect
                ? "Move to carry forward"
                : effectiveFunding === "CARRY_FORWARD"
                  ? "Pay from carry forward"
                  : direction === "PAY"
                    ? "Mark as paid"
                    : "Mark as collected"}
            </Button>
          </FormSection>
        </div>
      </div>
    </PageContainer>
  );
}

import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { BankTransactionStatusBadge } from "@/components/accounting/bank-transaction-status-badge";
import { AccountingActionBar } from "@/components/accounting/accounting-action-bar";
import { ErrorState } from "@/components/shared/error-state";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import {
  useBankTransaction,
  useMatchBankTransaction,
  useUnmatchBankTransaction,
} from "@/features/banking/hooks/use-banking";
import { canViewEntity, canUsePermission } from "@/features/permissions/utils/module-permissions";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export function BankTransactionDetailPage() {
  const { companyId, bankTransactionId } = useParams();
  const { company, permissions } = useActiveCompany();
  const canView = canViewEntity(permissions, "banking");
  const canManage = canUsePermission(permissions, ["banking.manage"]);
  const transactionQuery = useBankTransaction(companyId, bankTransactionId ?? null);
  const matchMutation = useMatchBankTransaction(companyId);
  const unmatchMutation = useUnmatchBankTransaction(companyId);

  if (!canView) {
    return <ErrorState title="Banking access restricted" description="Your current company membership does not include banking visibility." />;
  }

  if (transactionQuery.isLoading) {
    return <PageContainer><div className="surface p-6">Loading bank transaction...</div></PageContainer>;
  }

  if (transactionQuery.error || !transactionQuery.data) {
    return <ErrorState title="Bank transaction not found" description={transactionQuery.error?.message ?? "The requested bank transaction is unavailable."} />;
  }

  const transaction = transactionQuery.data;
  const activeMatchMutation = transaction.isMatched ? unmatchMutation : matchMutation;

  return (
    <PageContainer
      header={
        <PageHeader
          actions={<BankTransactionStatusBadge isCleared={transaction.isCleared} isMatched={transaction.isMatched} />}
          description="Review bank transaction status, matching position, and reconciliation readiness."
          eyebrow="Banking"
          title={transaction.description || "Bank transaction"}
        />
      }
    >
      <AccountingActionBar
        actions={
          canManage ? (
            <Button
              isLoading={activeMatchMutation.isPending}
              onClick={() =>
                transaction.isMatched
                  ? unmatchMutation.mutate(transaction.id)
                  : matchMutation.mutate(transaction.id)
              }
              type="button"
              variant="secondary"
            >
              {transaction.isMatched ? "Unmatch transaction" : "Match transaction"}
            </Button>
          ) : null
        }
      />

      {activeMatchMutation.error ? (
        <Alert title={activeMatchMutation.error.message} variant="destructive" />
      ) : null}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <div className="surface p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Bank account</p>
          <p className="mt-1 text-sm font-medium">{transaction.bankAccountName || transaction.bankAccountId}</p>
        </div>
        <div className="surface p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Transaction date</p>
          <p className="mt-1 text-sm font-medium">{formatDate(transaction.transactionDate)}</p>
        </div>
        <div className="surface p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Amount</p>
          <p className="mt-1 text-sm font-medium">
            {formatCurrency(transaction.amount, company?.baseCurrencyCode ?? company?.currencyCode ?? "USD")}
          </p>
        </div>
        <div className="surface p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Type</p>
          <p className="mt-1 text-sm font-medium">{transaction.type || "-"}</p>
        </div>
        <div className="surface p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Direction</p>
          <p className="mt-1 text-sm font-medium">{transaction.direction || "-"}</p>
        </div>
        <div className="surface p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Source</p>
          <p className="mt-1 text-sm font-medium">{transaction.source || "-"}</p>
        </div>
      </div>
    </PageContainer>
  );
}

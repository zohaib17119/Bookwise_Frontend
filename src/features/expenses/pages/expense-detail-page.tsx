import { Link, useNavigate, useParams } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { getCompanyBaseCurrency } from "@/features/companies/utils/company-currency";
import { useDeleteExpense, useExpense } from "@/features/expenses/hooks/use-expenses";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export function ExpenseDetailPage() {
  const navigate = useNavigate();
  const { companyId, expenseId } = useParams();
  const { company, permissions } = useActiveCompany();
  const expenseQuery = useExpense(companyId, expenseId ?? null);
  const deleteMutation = useDeleteExpense(companyId);
  const canView = canViewEntity(permissions, "expenses");
  const canManage = canManageEntity(permissions, "expenses");
  const displayCurrency = getCompanyBaseCurrency(company);

  if (!canView) {
    return (
      <ErrorState
        title="Expenses access restricted"
        description="Your current company membership does not include expense access."
      />
    );
  }

  if (expenseQuery.error) {
    return <ErrorState title="Unable to load expense" description={expenseQuery.error.message} />;
  }

  const expense = expenseQuery.data;

  return (
    <PageContainer
      header={
        <PageHeader
          actions={
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="ghost">
                <Link to={`/app/company/${companyId}/expenses`}>Back to expenses</Link>
              </Button>
              {canManage && expense ? (
                <Button
                  isLoading={deleteMutation.isPending}
                  onClick={async () => {
                    await deleteMutation.mutateAsync(expense.id);
                    navigate(`/app/company/${companyId}/expenses`);
                  }}
                  variant="destructive"
                >
                  Delete expense
                </Button>
              ) : null}
            </div>
          }
          description="Direct expense with posted journal entry."
          eyebrow="Purchases"
          title={expense?.description ?? "Expense"}
        />
      }
    >
      {deleteMutation.error ? <Alert title={deleteMutation.error.message} variant="destructive" /> : null}

      {expenseQuery.isLoading || !expense ? (
        <div className="h-48 animate-pulse rounded-2xl bg-slate-200/70" />
      ) : (
        <SectionCard description="Payment and accounting details for this expense." title="Expense summary">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">Payment date</dt>
              <dd className="font-medium">{formatDate(expense.paymentDate)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Amount</dt>
              <dd className="font-medium">
                {formatCurrency(Number(expense.amount), expense.currencyCode ?? displayCurrency)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Pay from</dt>
              <dd className="font-medium">{expense.paymentAccountName ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Category</dt>
              <dd className="font-medium">{expense.expenseAccountName ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Vendor</dt>
              <dd className="font-medium">{expense.vendorName ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Reference</dt>
              <dd className="font-medium">{expense.referenceNumber ?? "-"}</dd>
            </div>
          </dl>
        </SectionCard>
      )}
    </PageContainer>
  );
}

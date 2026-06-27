import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AccountingActionBar } from "@/components/accounting/accounting-action-bar";
import { JournalStatusBadge } from "@/components/accounting/journal-status-badge";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import {
  useJournalEntry,
  usePostJournalEntry,
  useReverseJournalEntry,
} from "@/features/journals/hooks/use-journals";
import type { JournalEntryLine } from "@/features/journals/types/journal.types";
import { canManageEntity, canUsePermission, canViewEntity } from "@/features/permissions/utils/module-permissions";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export function JournalDetailPage() {
  const { companyId, journalEntryId } = useParams();
  const { company, permissions } = useActiveCompany();
  const navigate = useNavigate();
  const [confirmMode, setConfirmMode] = useState<"post" | "reverse" | null>(null);
  const journalQuery = useJournalEntry(companyId, journalEntryId ?? null);
  const postMutation = usePostJournalEntry(companyId);
  const reverseMutation = useReverseJournalEntry(companyId);
  const canView = canViewEntity(permissions, "journals");
  const canManage = canManageEntity(permissions, "journals");
  const canPost = canUsePermission(permissions, ["journals.post", "journals.manage"]);
  const canReverse = canUsePermission(permissions, ["journals.reverse", "journals.manage"]);

  if (!canView) {
    return (
      <ErrorState
        title="Journal access restricted"
        description="Your current company membership does not include journal entry visibility."
      />
    );
  }

  if (journalQuery.isLoading) {
    return <PageContainer><div className="surface p-6">Loading journal entry...</div></PageContainer>;
  }

  if (journalQuery.error || !journalQuery.data) {
    return (
      <ErrorState
        title="Journal entry not found"
        description={journalQuery.error?.message ?? "The requested journal entry is unavailable."}
      />
    );
  }

  const journal = journalQuery.data;
  const mutation = confirmMode === "post" ? postMutation : reverseMutation;
  const columns: DataTableColumn<JournalEntryLine>[] = [
    {
      key: "account",
      header: "Account",
      render: (line) => line.accountName || line.accountId,
    },
    {
      key: "description",
      header: "Description",
      render: (line) => line.description || "-",
    },
    {
      key: "debit",
      header: "Debit",
      render: (line) => formatCurrency(line.debitAmount || 0, company?.baseCurrencyCode ?? company?.currencyCode ?? "USD"),
    },
    {
      key: "credit",
      header: "Credit",
      render: (line) => formatCurrency(line.creditAmount || 0, company?.baseCurrencyCode ?? company?.currencyCode ?? "USD"),
    },
  ];

  return (
    <PageContainer
      header={
        <PageHeader
          actions={<JournalStatusBadge status={journal.status} />}
          description="Review line-level postings, source references, and posting state."
          eyebrow="Accounting"
          title={journal.entryNumber || "Journal entry"}
        />
      }
    >
      <AccountingActionBar
        actions={
          <>
            <Button asChild variant="ghost">
              <Link to={`/app/company/${companyId}/journals`}>Back to journals</Link>
            </Button>
            {canManage && journal.status === "DRAFT" ? (
              <Button asChild variant="secondary">
                <Link to={`/app/company/${companyId}/journals/${journal.id}/edit`}>Edit</Link>
              </Button>
            ) : null}
            {canPost && journal.status === "DRAFT" ? (
              <Button onClick={() => setConfirmMode("post")} type="button">
                Post entry
              </Button>
            ) : null}
            {canReverse && journal.status === "POSTED" ? (
              <Button onClick={() => setConfirmMode("reverse")} type="button" variant="secondary">
                Reverse entry
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="surface p-5">
            <h3 className="text-base font-semibold">Entry details</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Entry date</p>
                <p className="mt-1 text-sm">{formatDate(journal.entryDate)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Reference</p>
                <p className="mt-1 text-sm">{journal.referenceNumber || "-"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Source module</p>
                <p className="mt-1 text-sm">{journal.sourceModule || "Manual"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Source ID</p>
                <p className="mt-1 text-sm">{journal.sourceId || "-"}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{journal.description || "No description"}</p>
          </div>

      <DataTable
        columns={columns}
        data={journal.lines ?? []}
        emptyDescription="This journal entry has no persisted lines."
        emptyTitle="No lines found"
        getRowKey={(line) => `${line.accountId}-${line.description ?? ""}-${line.debitAmount ?? 0}-${line.creditAmount ?? 0}`}
        isLoading={false}
      />
        </div>

        <div className="space-y-4">
          <div className="surface p-5">
            <h3 className="text-base font-semibold">Posting summary</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Debit total</dt>
                <dd>
                  {formatCurrency(
                    (journal.lines ?? []).reduce((sum, line) => sum + Number(line.debitAmount || 0), 0),
                    company?.baseCurrencyCode ?? company?.currencyCode ?? "USD",
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Credit total</dt>
                <dd>
                  {formatCurrency(
                    (journal.lines ?? []).reduce((sum, line) => sum + Number(line.creditAmount || 0), 0),
                    company?.baseCurrencyCode ?? company?.currencyCode ?? "USD",
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <ConfirmDeleteDialog
        description={
          confirmMode === "post"
            ? "Posting will make this entry operationally final in the general ledger."
            : "Reversal will create compensating entries per backend rules."
        }
        isPending={mutation.isPending}
        onClose={() => {
          setConfirmMode(null);
          mutation.reset();
        }}
        onConfirm={async () => {
          if (confirmMode === "post") {
            await postMutation.mutateAsync(journal.id);
          } else if (confirmMode === "reverse") {
            await reverseMutation.mutateAsync(journal.id);
          }
          setConfirmMode(null);
          navigate(0);
        }}
        open={Boolean(confirmMode)}
        title={confirmMode === "post" ? "Post journal entry?" : "Reverse journal entry?"}
      />
    </PageContainer>
  );
}

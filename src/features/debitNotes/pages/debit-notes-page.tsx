import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EntityListPage } from "@/components/shared/entity-list-page";
import { ErrorState } from "@/components/shared/error-state";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { getCompanyBaseCurrency } from "@/features/companies/utils/company-currency";
import { canShowZatca } from "@/features/compliance/utils/compliance-access";
import { CreateAdjustmentNoteDialog } from "@/features/creditNotes/components/create-adjustment-note-dialog";
import {
  useCreateDebitNote,
  useDebitNotesPaginated,
} from "@/features/debitNotes/hooks/use-debit-notes";
import type { Invoice } from "@/features/invoices/types/invoice.types";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export function DebitNotesPage() {
  const navigate = useNavigate();
  const { companyId, company, permissions } = useActiveCompany();
  const showZatca = canShowZatca(company);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [createOpen, setCreateOpen] = useState(false);
  const notesQuery = useDebitNotesPaginated(companyId, { page, limit });
  const createMutation = useCreateDebitNote(companyId);
  const canView = canViewEntity(permissions, "invoices");
  const canManage = canManageEntity(permissions, "invoices");
  const baseCurrency = getCompanyBaseCurrency(company);

  if (!canView) {
    return (
      <ErrorState
        title="Debit notes access restricted"
        description="Your current company membership does not include invoice access."
      />
    );
  }

  const columns: DataTableColumn<Invoice>[] = [
    {
      key: "number",
      header: "Debit note",
      render: (note) => (
        <div>
          <Link
            className="font-medium text-primary"
            to={`/app/company/${companyId}/invoices/${note.id}`}
          >
            {note.invoiceNumber || "Draft debit note"}
          </Link>
          {note.originalInvoice ? (
            <p className="text-xs text-muted-foreground">
              Original:{" "}
              <Link
                className="underline"
                to={`/app/company/${companyId}/invoices/${note.originalInvoice.id}`}
              >
                {note.originalInvoice.invoiceNumber || "Invoice"}
              </Link>
            </p>
          ) : null}
        </div>
      ),
    },
    { key: "customer", header: "Customer", render: (note) => note.customerName || "-" },
    { key: "issueDate", header: "Issue Date", render: (note) => formatDate(note.issueDate) },
    {
      key: "status",
      header: "Status",
      render: (note) => <DocumentStatusBadge status={note.status} />,
    },
    ...(showZatca
      ? [
          {
            key: "complianceStatus",
            header: "ZATCA",
            render: (note: Invoice) => (
              <DocumentStatusBadge status={note.complianceStatus ?? "NOT_APPLICABLE"} />
            ),
          } satisfies DataTableColumn<Invoice>,
        ]
      : []),
    {
      key: "total",
      header: "Total",
      className: "text-right",
      render: (note) =>
        formatCurrency(
          Number(note.total ?? note.totals?.total ?? 0),
          note.currencyCode ?? baseCurrency,
        ),
    },
  ];

  return (
    <>
      <EntityListPage
        content={
          notesQuery.error ? (
            <ErrorState title="Unable to load debit notes" description={notesQuery.error.message} />
          ) : (
            <DataTable
              columns={columns}
              data={notesQuery.data?.items ?? []}
              emptyDescription="Create a debit note, pick an issued invoice, adjust lines and reason, then issue."
              emptyTitle="No debit notes yet"
              getRowKey={(note) => note.id}
              isLoading={notesQuery.isLoading}
              pagination={
                notesQuery.data
                  ? {
                      page: notesQuery.data.pagination.page,
                      totalPages: notesQuery.data.pagination.totalPages,
                      total: notesQuery.data.pagination.total,
                      limit: notesQuery.data.pagination.limit,
                      onPageChange: setPage,
                      onLimitChange: (next) => {
                        setLimit(next);
                        setPage(1);
                      },
                    }
                  : undefined
              }
            />
          )
        }
        description="Additional charges linked to issued invoices, with ZATCA status when enabled."
        eyebrow="Sales documents"
        headerActions={
          canManage ? (
            <Button onClick={() => setCreateOpen(true)} variant="primary">
              <Plus className="mr-1.5 h-4 w-4" />
              Create debit note
            </Button>
          ) : null
        }
        title="Debit notes"
      />

      {companyId ? (
        <CreateAdjustmentNoteDialog
          baseCurrency={baseCurrency}
          companyId={companyId}
          errorMessage={createMutation.error?.message ?? null}
          fixedType="DEBIT_NOTE"
          isPending={createMutation.isPending}
          onClose={() => {
            setCreateOpen(false);
            createMutation.reset();
          }}
          onConfirm={async ({ originalInvoiceId, notes, lines }) => {
            const note = await createMutation.mutateAsync({
              originalInvoiceId,
              notes,
              lines,
              sendImmediately: true,
            });
            setCreateOpen(false);
            const noteId = (note as { id?: string })?.id;
            if (noteId) {
              navigate(`/app/company/${companyId}/invoices/${noteId}`);
            }
          }}
          open={createOpen}
        />
      ) : null}
    </>
  );
}

import { useDeferredValue, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EntityListPage } from "@/components/shared/entity-list-page";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableActions } from "@/components/shared/table-actions";
import { formatCurrency } from "@/lib/utils/format";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import { InvestorFormDrawer } from "@/features/investors/components/investor-form-drawer";
import {
  useCreateInvestor,
  useDeleteInvestor,
  useInvestorsPaginated,
  useUpdateInvestor,
} from "@/features/investors/hooks/use-investors";
import type { InvestorFormValues } from "@/features/investors/schemas/investor.schema";
import type { Investor } from "@/features/investors/types/investor.types";
import { getApiErrorMessage } from "@/lib/api/error";

export function InvestorsPage() {
  const { companyId, currency, permissions } = useActiveCompany();
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Investor | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);
  const investorsQuery = useInvestorsPaginated(companyId, {
    search: deferredSearch.trim() || undefined,
    includeInactive,
    page,
    limit,
  });
  const createMutation = useCreateInvestor(companyId);
  const updateMutation = useUpdateInvestor(companyId, selectedInvestor?.id ?? null);
  const deleteMutation = useDeleteInvestor(companyId);
  const canView = canViewEntity(permissions, "investors");
  const canManage = canManageEntity(permissions, "investors");

  if (!canView) {
    return (
      <ErrorState
        title="Investors access restricted"
        description="Your current company membership does not include investor directory access."
      />
    );
  }

  const columns: DataTableColumn<Investor>[] = [
    {
      key: "name",
      header: "Investor",
      render: (investor) => (
        <div>
          <Link
            className="font-medium text-foreground underline-offset-2 hover:underline"
            to={`/app/company/${companyId}/investors/${investor.id}`}
          >
            {investor.code ? `${investor.code} - ` : ""}
            {investor.name}
          </Link>
          <p className="text-xs text-muted-foreground">{investor.email || investor.phone || "—"}</p>
        </div>
      ),
    },
    {
      key: "total",
      header: "Total invested",
      render: (investor) => formatCurrency(investor.totalInvested, currency),
    },
    {
      key: "count",
      header: "Investments",
      render: (investor) => String(investor.investmentCount),
    },
    {
      key: "status",
      header: "Status",
      render: (investor) => <StatusBadge active={investor.isActive} />,
    },
    {
      key: "actions",
      header: "",
      render: (investor) =>
        canManage ? (
          <TableActions
            onDelete={() => setDeleteTarget(investor)}
            onEdit={() => {
              setDrawerMode("edit");
              setSelectedInvestor(investor);
              setDrawerOpen(true);
            }}
          />
        ) : null,
    },
  ];

  const handleSubmit = async (values: InvestorFormValues) => {
    setActionError(null);
    try {
      const payload = {
        code: values.code?.trim() || undefined,
        name: values.name.trim(),
        email: values.email?.trim() || undefined,
        phone: values.phone?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
        isActive: values.isActive,
      };
      if (drawerMode === "create") {
        await createMutation.mutateAsync(payload);
      } else if (selectedInvestor) {
        await updateMutation.mutateAsync(payload);
      }
      setDrawerOpen(false);
      setSelectedInvestor(null);
    } catch (err) {
      setActionError(getApiErrorMessage(err));
      throw err;
    }
  };

  return (
    <>
      <EntityListPage
        content={
          investorsQuery.error ? (
            <ErrorState
              title="Unable to load investors"
              description={investorsQuery.error.message}
            />
          ) : (
            <>
              {actionError ? (
                <Alert className="mb-4" description={actionError} title="Action failed" variant="destructive" />
              ) : null}
              <DataTable
                columns={columns}
                data={investorsQuery.data?.items ?? []}
                emptyDescription="Add investors and record capital into cash or bank."
                emptyTitle="No investors yet"
                getRowKey={(investor) => investor.id}
                isLoading={investorsQuery.isLoading}
                pagination={
                  investorsQuery.data
                    ? {
                        page: investorsQuery.data.pagination.page,
                        totalPages: investorsQuery.data.pagination.totalPages,
                        total: investorsQuery.data.pagination.total,
                        limit: investorsQuery.data.pagination.limit,
                        onPageChange: setPage,
                        onLimitChange: (next) => {
                          setLimit(next);
                          setPage(1);
                        },
                      }
                    : undefined
                }
              />
            </>
          )
        }
        description="Capital partners and investment history into cash or bank."
        eyebrow="Accounting"
        headerActions={
          canManage ? (
            <Button
              onClick={() => {
                setDrawerMode("create");
                setSelectedInvestor(null);
                setDrawerOpen(true);
              }}
              type="button"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add investor
            </Button>
          ) : null
        }
        title="Investors"
        toolbar={
          <FilterBar>
            <SearchInput
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Search investors"
              value={search}
            />
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={includeInactive}
                onChange={(event) => {
                  setIncludeInactive(event.target.checked);
                  setPage(1);
                }}
              />
              Include inactive
            </label>
          </FilterBar>
        }
      />

      <InvestorFormDrawer
        companyId={companyId}
        error={null}
        investor={selectedInvestor}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        mode={drawerMode}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedInvestor(null);
        }}
        onSubmit={handleSubmit}
        open={drawerOpen}
      />

      <ConfirmDeleteDialog
        description={`Soft-delete ${deleteTarget?.name ?? "this investor"}? Investment history remains for reporting.`}
        isPending={deleteMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteMutation.mutateAsync(deleteTarget.id);
          setDeleteTarget(null);
        }}
        open={Boolean(deleteTarget)}
        title="Delete investor"
      />
    </>
  );
}

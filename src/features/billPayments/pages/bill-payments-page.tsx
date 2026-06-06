import { useDeferredValue, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EntityListPage } from "@/components/shared/entity-list-page";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { useBillPayments } from "@/features/billPayments/hooks/use-bill-payments";
import type { BillPayment } from "@/features/billPayments/types/bill-payment.types";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import { useVendorOptions } from "@/features/vendors/hooks/use-vendors";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export function BillPaymentsPage() {
  const { companyId, company, permissions } = useActiveCompany();
  const [search, setSearch] = useState("");
  const [vendorId, setVendorId] = useState("");
  const deferredSearch = useDeferredValue(search);
  const vendorsQuery = useVendorOptions(companyId);
  const paymentsQuery = useBillPayments(companyId, {
    search: deferredSearch.trim() || undefined,
    vendorId: vendorId || undefined,
  });
  const canView = canViewEntity(permissions, "bill_payments");
  const canManage = canManageEntity(permissions, "bill_payments");

  if (!canView) {
    return <ErrorState title="Bill payments access restricted" description="Your current company membership does not include bill payment access." />;
  }

  const columns: DataTableColumn<BillPayment>[] = [
    { key: "paymentDate", header: "Payment Date", render: (payment) => formatDate(payment.paymentDate) },
    {
      key: "vendor",
      header: "Vendor",
      render: (payment) => (
        <Link className="font-medium text-primary" to={`/app/company/${companyId}/bill-payments/${payment.id}`}>
          {payment.vendorName || "Bill payment"}
        </Link>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      className: "text-right",
      render: (payment) => formatCurrency(payment.amount, payment.currencyCode ?? company?.currency ?? "USD"),
    },
    {
      key: "unapplied",
      header: "Unapplied",
      className: "text-right",
      render: (payment) => formatCurrency(payment.unappliedAmount ?? 0, payment.currencyCode ?? company?.currency ?? "USD"),
    },
    { key: "method", header: "Payment Method", render: (payment) => payment.paymentMethod },
  ];

  return (
    <EntityListPage
      content={
        paymentsQuery.error ? (
          <ErrorState title="Unable to load bill payments" description={paymentsQuery.error.message} />
        ) : (
          <DataTable
            columns={columns}
            data={paymentsQuery.data ?? []}
            emptyDescription="Record outgoing bill payments and allocate them across open bills."
            emptyTitle="No bill payments yet"
            getRowKey={(payment) => payment.id}
            isLoading={paymentsQuery.isLoading}
          />
        )
      }
      description="Track outgoing payments to vendors and bill allocation history."
      eyebrow="Payables"
      headerActions={
        <Button asChild disabled={!canManage}>
          <Link to={`/app/company/${companyId}/bill-payments/new`}>
            <Plus className="mr-2 h-4 w-4" />
            New bill payment
          </Link>
        </Button>
      }
      title="Bill Payments"
      toolbar={
        <FilterBar>
          <SearchInput onChange={setSearch} placeholder="Search payment reference or vendor" value={search} />
          <Select className="min-w-[220px]" onChange={(e) => setVendorId(e.target.value)} value={vendorId}>
            <option value="">All vendors</option>
            {(vendorsQuery.data ?? []).map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.displayName}
              </option>
            ))}
          </Select>
        </FilterBar>
      }
    />
  );
}

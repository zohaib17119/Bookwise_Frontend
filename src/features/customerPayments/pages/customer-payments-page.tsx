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
import { useCustomerOptions } from "@/features/customers/hooks/use-customers";
import { useCustomerPayments } from "@/features/customerPayments/hooks/use-customer-payments";
import type { CustomerPayment } from "@/features/customerPayments/types/customer-payment.types";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export function CustomerPaymentsPage() {
  const { companyId, company, permissions } = useActiveCompany();
  const [search, setSearch] = useState("");
  const [customerId, setCustomerId] = useState("");
  const deferredSearch = useDeferredValue(search);
  const customersQuery = useCustomerOptions(companyId);
  const paymentsQuery = useCustomerPayments(companyId, {
    search: deferredSearch.trim() || undefined,
    customerId: customerId || undefined,
  });
  const canView = canViewEntity(permissions, "customer_payments");
  const canManage = canManageEntity(permissions, "customer_payments");

  if (!canView) {
    return <ErrorState title="Customer payments access restricted" description="Your current company membership does not include customer payment access." />;
  }

  const columns: DataTableColumn<CustomerPayment>[] = [
    {
      key: "paymentDate",
      header: "Payment Date",
      render: (payment) => formatDate(payment.paymentDate),
    },
    {
      key: "customer",
      header: "Customer",
      render: (payment) => (
        <Link className="font-medium text-primary" to={`/app/company/${companyId}/customer-payments/${payment.id}`}>
          {payment.customerName || "Customer payment"}
        </Link>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      className: "text-right",
      render: (payment) => formatCurrency(payment.amount, payment.currencyCode ?? company?.baseCurrencyCode ?? company?.currencyCode ?? "USD"),
    },
    {
      key: "unapplied",
      header: "Unapplied",
      className: "text-right",
      render: (payment) => formatCurrency(payment.unappliedAmount ?? 0, payment.currencyCode ?? company?.baseCurrencyCode ?? company?.currencyCode ?? "USD"),
    },
    {
      key: "method",
      header: "Payment Method",
      render: (payment) => payment.paymentMethod,
    },
  ];

  return (
    <EntityListPage
      content={
        paymentsQuery.error ? (
          <ErrorState title="Unable to load customer payments" description={paymentsQuery.error.message} />
        ) : (
          <DataTable
            columns={columns}
            data={paymentsQuery.data ?? []}
            emptyDescription="Record customer receipts and allocate them across open invoices."
            emptyTitle="No customer payments yet"
            getRowKey={(payment) => payment.id}
            isLoading={paymentsQuery.isLoading}
          />
        )
      }
      description="Track received payments, unapplied balances, and invoice allocations."
      eyebrow="Receivables"
      headerActions={
        <Button asChild disabled={!canManage}>
          <Link to={`/app/company/${companyId}/customer-payments/new`}>
            <Plus className="mr-2 h-4 w-4" />
            New payment
          </Link>
        </Button>
      }
      title="Customer Payments"
      toolbar={
        <FilterBar>
          <SearchInput onChange={setSearch} placeholder="Search payment reference or customer" value={search} />
          <Select className="min-w-[220px]" onChange={(e) => setCustomerId(e.target.value)} value={customerId}>
            <option value="">All customers</option>
            {(customersQuery.data ?? []).map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.displayName}
              </option>
            ))}
          </Select>
        </FilterBar>
      }
    />
  );
}

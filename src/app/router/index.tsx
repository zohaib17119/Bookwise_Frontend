import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { AppLayout } from "@/app/layouts/app-layout";
import { AuthLayout } from "@/app/layouts/auth-layout";
import { CompanyAppShell } from "@/app/layouts/company-app-shell";
import { CompanyRouteGuard } from "@/app/router/guards/company-route-guard";
import { ProtectedRoute } from "@/app/router/guards/protected-route";
import { PublicRoute } from "@/app/router/guards/public-route";
import { SettingsLayout } from "@/components/settings/settings-layout";
import { AccountsPage } from "@/features/accounts/pages/accounts-page";
import { ActivityPage } from "@/features/audit/pages/activity-page";
import { AuditLogDetailPage } from "@/features/audit/pages/audit-log-detail-page";
import { AuditLogsPage } from "@/features/audit/pages/audit-logs-page";
import { LoginPage } from "@/features/auth/pages/login-page";
import { RegisterPage } from "@/features/auth/pages/register-page";
import { BankAccountsPage } from "@/features/banking/pages/bank-accounts-page";
import { BankTransactionDetailPage } from "@/features/banking/pages/bank-transaction-detail-page";
import { BankTransactionsPage } from "@/features/banking/pages/bank-transactions-page";
import { BillDetailPage } from "@/features/bills/pages/bill-detail-page";
import { BillFormPage } from "@/features/bills/pages/bill-form-page";
import { BillsPage } from "@/features/bills/pages/bills-page";
import { BillPaymentDetailPage } from "@/features/billPayments/pages/bill-payment-detail-page";
import { BillPaymentFormPage } from "@/features/billPayments/pages/bill-payment-form-page";
import { BillPaymentsPage } from "@/features/billPayments/pages/bill-payments-page";
import { CompanyCreatePage } from "@/features/companies/pages/company-create-page";
import { CompanyDetailPage } from "@/features/companies/pages/company-detail-page";
import { CompanyListPage } from "@/features/companies/pages/company-list-page";
import { CustomersPage } from "@/features/customers/pages/customers-page";
import { CustomerPaymentDetailPage } from "@/features/customerPayments/pages/customer-payment-detail-page";
import { CustomerPaymentFormPage } from "@/features/customerPayments/pages/customer-payment-form-page";
import { CustomerPaymentsPage } from "@/features/customerPayments/pages/customer-payments-page";
import { DashboardPage } from "@/features/dashboard/pages/dashboard-page";
import { EstimateDetailPage } from "@/features/estimates/pages/estimate-detail-page";
import { EstimateFormPage } from "@/features/estimates/pages/estimate-form-page";
import { EstimatesPage } from "@/features/estimates/pages/estimates-page";
import { InventoryAdjustmentDetailPage } from "@/features/inventory/pages/inventory-adjustment-detail-page";
import { InventoryAdjustmentFormPage } from "@/features/inventory/pages/inventory-adjustment-form-page";
import { InventoryAdjustmentsPage } from "@/features/inventory/pages/inventory-adjustments-page";
import { InventoryValuationPage } from "@/features/inventory/pages/inventory-valuation-page";
import { StockMovementsPage } from "@/features/inventory/pages/stock-movements-page";
import { StockOnHandPage } from "@/features/inventory/pages/stock-on-hand-page";
import { InvoiceDetailPage } from "@/features/invoices/pages/invoice-detail-page";
import { InvoiceFormPage } from "@/features/invoices/pages/invoice-form-page";
import { InvoicesPage } from "@/features/invoices/pages/invoices-page";
import { ItemsPage } from "@/features/items/pages/items-page";
import { JournalDetailPage } from "@/features/journals/pages/journal-detail-page";
import { JournalFormPage } from "@/features/journals/pages/journal-form-page";
import { JournalsPage } from "@/features/journals/pages/journals-page";
import { LedgerAccountPage } from "@/features/journals/pages/ledger-account-page";
import { LedgerPage } from "@/features/journals/pages/ledger-page";
import { PricingPage } from "@/features/pricing/pages/pricing-page";
import { SubscriptionPage } from "@/features/pricing/pages/subscription-page";
import { ReconciliationDetailPage } from "@/features/reconciliations/pages/reconciliation-detail-page";
import { ReconciliationFormPage } from "@/features/reconciliations/pages/reconciliation-form-page";
import { ReconciliationsPage } from "@/features/reconciliations/pages/reconciliations-page";
import { ApAgingPage } from "@/features/reports/pages/ap-aging-page";
import { ArAgingPage } from "@/features/reports/pages/ar-aging-page";
import { BalanceSheetPage } from "@/features/reports/pages/balance-sheet-page";
import { GeneralLedgerPage } from "@/features/reports/pages/general-ledger-page";
import { ProfitAndLossPage } from "@/features/reports/pages/profit-and-loss-page";
import { ReportsHomePage } from "@/features/reports/pages/reports-home-page";
import { TrialBalancePage } from "@/features/reports/pages/trial-balance-page";
import { AccountingSettingsPage } from "@/features/settings/pages/accounting-settings-page";
import { CompanySettingsPage } from "@/features/settings/pages/company-settings-page";
import { SettingsHomePage } from "@/features/settings/pages/settings-home-page";
import { SettingsPlaceholderPage } from "@/features/settings/pages/settings-placeholder-page";
import { SettingsTeamPage } from "@/features/settings/pages/settings-team-page";
import { SettingsTaxPage } from "@/features/settings/pages/settings-tax-page";
import { TaxCodesPage } from "@/features/tax/pages/tax-codes-page";
import { TaxDetailPage } from "@/features/tax/pages/tax-detail-page";
import { TaxRatesPage } from "@/features/tax/pages/tax-rates-page";
import { TaxSettingsPage } from "@/features/tax/pages/tax-settings-page";
import { TaxSummaryPage } from "@/features/tax/pages/tax-summary-page";
import { VendorsPage } from "@/features/vendors/pages/vendors-page";
import { ForbiddenPage } from "@/pages/forbidden-page";
import { NotFoundPage } from "@/pages/not-found-page";

const router = createBrowserRouter([
  {
    path: "/pricing",
    element: <PricingPage />,
  },
  {
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: "/login", element: <LoginPage /> },
          { path: "/register", element: <RegisterPage /> },
        ],
      },
    ],
  },
  {
    path: "/app",
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate replace to="/app/companies" /> },
          { path: "companies", element: <CompanyListPage /> },
          { path: "companies/new", element: <CompanyCreatePage /> },
          { path: "subscription", element: <SubscriptionPage /> },
          {
            path: "company/:companyId",
            element: <CompanyRouteGuard />,
            children: [
              {
                element: <CompanyAppShell />,
                children: [
                  { index: true, element: <CompanyDetailPage /> },
                  { path: "dashboard", element: <DashboardPage /> },
                  { path: "accounts", element: <AccountsPage /> },
                  { path: "customers", element: <CustomersPage /> },
                  { path: "vendors", element: <VendorsPage /> },
                  { path: "items", element: <ItemsPage /> },
                  { path: "estimates", element: <EstimatesPage /> },
                  { path: "estimates/new", element: <EstimateFormPage mode="create" /> },
                  { path: "estimates/:estimateId", element: <EstimateDetailPage /> },
                  { path: "estimates/:estimateId/edit", element: <EstimateFormPage mode="edit" /> },
                  { path: "invoices", element: <InvoicesPage /> },
                  { path: "invoices/new", element: <InvoiceFormPage mode="create" /> },
                  { path: "invoices/:invoiceId", element: <InvoiceDetailPage /> },
                  { path: "invoices/:invoiceId/edit", element: <InvoiceFormPage mode="edit" /> },
                  { path: "bills", element: <BillsPage /> },
                  { path: "bills/new", element: <BillFormPage mode="create" /> },
                  { path: "bills/:billId", element: <BillDetailPage /> },
                  { path: "bills/:billId/edit", element: <BillFormPage mode="edit" /> },
                  { path: "customer-payments", element: <CustomerPaymentsPage /> },
                  { path: "customer-payments/new", element: <CustomerPaymentFormPage /> },
                  { path: "customer-payments/:paymentId", element: <CustomerPaymentDetailPage /> },
                  { path: "bill-payments", element: <BillPaymentsPage /> },
                  { path: "bill-payments/new", element: <BillPaymentFormPage /> },
                  { path: "bill-payments/:paymentId", element: <BillPaymentDetailPage /> },
                  { path: "journals", element: <JournalsPage /> },
                  { path: "journals/new", element: <JournalFormPage mode="create" /> },
                  { path: "journals/:journalEntryId", element: <JournalDetailPage /> },
                  { path: "journals/:journalEntryId/edit", element: <JournalFormPage mode="edit" /> },
                  { path: "ledger", element: <LedgerPage /> },
                  { path: "ledger/:accountId", element: <LedgerAccountPage /> },
                  { path: "reports", element: <ReportsHomePage /> },
                  { path: "reports/trial-balance", element: <TrialBalancePage /> },
                  { path: "reports/general-ledger", element: <GeneralLedgerPage /> },
                  { path: "reports/profit-and-loss", element: <ProfitAndLossPage /> },
                  { path: "reports/balance-sheet", element: <BalanceSheetPage /> },
                  { path: "reports/accounts-receivable-aging", element: <ArAgingPage /> },
                  { path: "reports/accounts-payable-aging", element: <ApAgingPage /> },
                  { path: "tax", element: <Navigate replace to="rates" relative="path" /> },
                  { path: "tax/rates", element: <TaxRatesPage /> },
                  { path: "tax/codes", element: <TaxCodesPage /> },
                  { path: "tax/settings", element: <TaxSettingsPage /> },
                  { path: "tax/reports/summary", element: <TaxSummaryPage /> },
                  { path: "tax/reports/detail", element: <TaxDetailPage /> },
                  { path: "banking", element: <Navigate replace to="accounts" relative="path" /> },
                  { path: "banking/accounts", element: <BankAccountsPage /> },
                  { path: "banking/transactions", element: <BankTransactionsPage /> },
                  { path: "banking/transactions/:bankTransactionId", element: <BankTransactionDetailPage /> },
                  { path: "banking/reconciliations", element: <ReconciliationsPage /> },
                  { path: "banking/reconciliations/new", element: <ReconciliationFormPage /> },
                  { path: "banking/reconciliations/:reconciliationSessionId", element: <ReconciliationDetailPage /> },
                  { path: "inventory", element: <Navigate replace to="stock-on-hand" relative="path" /> },
                  { path: "inventory/stock-on-hand", element: <StockOnHandPage /> },
                  { path: "inventory/stock-movements", element: <StockMovementsPage /> },
                  { path: "inventory/valuation", element: <InventoryValuationPage /> },
                  { path: "inventory/adjustments", element: <InventoryAdjustmentsPage /> },
                  { path: "inventory/adjustments/new", element: <InventoryAdjustmentFormPage mode="create" /> },
                  { path: "inventory/adjustments/:inventoryAdjustmentId", element: <InventoryAdjustmentDetailPage /> },
                  { path: "inventory/adjustments/:inventoryAdjustmentId/edit", element: <InventoryAdjustmentFormPage mode="edit" /> },
                  { path: "audit", element: <AuditLogsPage /> },
                  { path: "audit/:auditLogId", element: <AuditLogDetailPage /> },
                  { path: "activity", element: <ActivityPage /> },
                  {
                    path: "settings",
                    element: <SettingsLayout />,
                    children: [
                      { index: true, element: <SettingsHomePage /> },
                      { path: "company", element: <CompanySettingsPage /> },
                      { path: "accounting", element: <AccountingSettingsPage /> },
                      { path: "tax", element: <SettingsTaxPage /> },
                      { path: "team", element: <SettingsTeamPage /> },
                      {
                        path: "preferences",
                        element: (
                          <SettingsPlaceholderPage
                            description="Preferences can hold locale, notifications, and UX controls later."
                            title="Preferences placeholder"
                          />
                        ),
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  { path: "/forbidden", element: <ForbiddenPage /> },
  { path: "/", element: <Navigate replace to="/app/companies" /> },
  { path: "*", element: <NotFoundPage /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}

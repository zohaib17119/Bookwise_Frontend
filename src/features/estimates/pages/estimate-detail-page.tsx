import { useNavigate, useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { PageContainer } from "@/components/shared/page-container";
import { DocumentActionBar } from "@/components/documents/document-action-bar";
import { DocumentDetailsSection } from "@/components/documents/document-details-section";
import { DocumentHeaderCard } from "@/components/documents/document-header-card";
import { DocumentLinesTable } from "@/components/documents/document-lines-table";
import { DocumentMetaSection } from "@/components/documents/document-meta-section";
import { DocumentTotalsCard } from "@/components/documents/document-totals-card";
import { formatDate } from "@/lib/utils/format";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { getCompanyBaseCurrency } from "@/features/companies/utils/company-currency";
import {
  useConvertEstimateToInvoice,
  useDeleteEstimate,
  useEstimate,
} from "@/features/estimates/hooks/use-estimates";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import { useState } from "react";

export function EstimateDetailPage() {
  const navigate = useNavigate();
  const { estimateId, companyId } = useParams();
  const { permissions, company } = useActiveCompany();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const estimateQuery = useEstimate(companyId, estimateId ?? null);
  const deleteMutation = useDeleteEstimate(companyId);
  const convertMutation = useConvertEstimateToInvoice(companyId);
  const canView = canViewEntity(permissions, "estimates");
  const canManage = canManageEntity(permissions, "estimates");

  if (!canView) {
    return (
      <ErrorState
        title="Estimate access restricted"
        description="Your current company membership does not include estimate access."
      />
    );
  }

  if (estimateQuery.isLoading) {
    return <PageContainer><div className="surface p-6">Loading estimate...</div></PageContainer>;
  }

  if (estimateQuery.error || !estimateQuery.data) {
    return (
      <ErrorState
        title="Estimate not found"
        description={estimateQuery.error?.message ?? "The requested estimate is unavailable."}
      />
    );
  }

  const estimate = estimateQuery.data;
  const documentCurrency = estimate.currencyCode ?? getCompanyBaseCurrency(company);

  return (
    <PageContainer className="space-y-6">
      <DocumentHeaderCard
        actions={
          canManage ? (
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="secondary">
                <Link to={`/app/company/${companyId}/estimates/${estimate.id}/edit`}>
                  Edit estimate
                </Link>
              </Button>
              <Button
                isLoading={convertMutation.isPending}
                onClick={async () => {
                  const result = await convertMutation.mutateAsync(estimate.id);
                  if (result.invoiceId) {
                    navigate(`/app/company/${companyId}/invoices/${result.invoiceId}`);
                  }
                }}
                variant="secondary"
              >
                Convert to invoice
              </Button>
              <Button onClick={() => setDeleteOpen(true)} variant="ghost">
                Delete
              </Button>
            </div>
          ) : null
        }
        description="Review the estimate before sharing it with the customer or converting it into an invoice."
        number={estimate.estimateNumber}
        status={estimate.status}
        title="Estimate details"
      />

      {convertMutation.error ? (
        <Alert title={convertMutation.error.message} variant="destructive" />
      ) : null}

      <DocumentActionBar
        actions={
          <>
            <Button asChild variant="ghost">
              <Link to={`/app/company/${companyId}/estimates`}>Back to estimates</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to={`/app/company/${companyId}/customer-payments/new?customerId=${estimate.customerId}`}>
                Future receive payment
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <DocumentDetailsSection title="Document overview">
            <div className="grid gap-4 md:grid-cols-2">
              <DocumentMetaSection
                items={[
                  { label: "Customer", value: estimate.customerName || "-" },
                  { label: "Reference", value: estimate.referenceNumber || "-" },
                  { label: "Issue date", value: formatDate(estimate.issueDate) },
                  { label: "Expiry date", value: formatDate(estimate.expiryDate) },
                ]}
                title="Header"
              />
              <DocumentMetaSection
                items={[
                  { label: "Currency", value: documentCurrency },
                  { label: "Terms", value: estimate.terms || "-" },
                  { label: "Notes", value: estimate.notes || "-" },
                ]}
                title="Commercials"
              />
            </div>
          </DocumentDetailsSection>

          <DocumentDetailsSection title="Line items">
            <DocumentLinesTable
              currencyCode={documentCurrency}
              lines={estimate.lines}
              mode="sales"
            />
          </DocumentDetailsSection>
        </div>

        <div className="space-y-6">
          <DocumentTotalsCard
            currencyCode={documentCurrency}
            discountTotal={estimate.totals?.discountTotal}
            subtotal={estimate.totals?.subtotal}
            taxTotal={estimate.totals?.taxTotal}
            total={estimate.totals?.total}
          />
        </div>
      </div>

      <ConfirmDeleteDialog
        description="This will remove the estimate from active workflows while preserving audit visibility on the backend."
        isPending={deleteMutation.isPending}
        onClose={() => {
          setDeleteOpen(false);
          deleteMutation.reset();
        }}
        onConfirm={async () => {
          await deleteMutation.mutateAsync(estimate.id);
          navigate(`/app/company/${companyId}/estimates`);
        }}
        open={deleteOpen}
        title="Delete estimate?"
      />
    </PageContainer>
  );
}

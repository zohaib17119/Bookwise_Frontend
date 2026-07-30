import { Link, useParams } from "react-router-dom";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { canShowZatca } from "@/features/compliance/utils/compliance-access";
import { ZatcaSettingsPage } from "./zatca-settings-page";
import { ErrorState } from "@/components/shared/error-state";

/** ZATCA settings are only for Saudi Arabia companies. */
export function ZatcaSettingsRoute() {
  const { companyId } = useParams();
  const { company, isLoading } = useActiveCompany();

  if (isLoading) {
    return <div className="surface p-6 text-sm text-muted-foreground">Loading…</div>;
  }

  if (!canShowZatca(company)) {
    return (
      <ErrorState
        title="ZATCA not available"
        description="ZATCA e-invoicing applies only when your company country is Saudi Arabia. Create or switch to an SA company to configure it."
        action={
          companyId ? (
            <Link className="text-sm underline" to={`/app/company/${companyId}/settings/company`}>
              Back to company settings
            </Link>
          ) : undefined
        }
      />
    );
  }

  return <ZatcaSettingsPage />;
}

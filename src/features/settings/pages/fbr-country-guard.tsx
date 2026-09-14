import { Link, useParams } from "react-router-dom";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { canShowFbrSettings } from "@/features/compliance/utils/compliance-access";
import { FbrSettingsPage } from "./fbr-settings-page";
import { ErrorState } from "@/components/shared/error-state";

/** FBR settings are only for Pakistan companies. */
export function FbrSettingsRoute() {
  const { companyId } = useParams();
  const { company, isLoading } = useActiveCompany();

  if (isLoading) {
    return <div className="surface p-6 text-sm text-muted-foreground">Loading…</div>;
  }

  if (!canShowFbrSettings(company)) {
    return (
      <ErrorState
        title="FBR not available"
        description="FBR Digital Invoicing applies only when your company country is Pakistan. Create or switch to a PK company to configure it."
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

  return <FbrSettingsPage />;
}

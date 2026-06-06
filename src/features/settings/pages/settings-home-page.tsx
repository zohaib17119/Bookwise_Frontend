import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

export function SettingsHomePage() {
  const { companyId } = useParams();

  return (
    <EmptyState
      action={
        <Button asChild>
          <Link to={`/app/company/${companyId}/settings/company`}>Open company settings</Link>
        </Button>
      }
      description="Choose a settings section from the left navigation to manage company configuration."
      title="Settings ready"
    />
  );
}

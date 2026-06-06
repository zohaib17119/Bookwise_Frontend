import { Link } from "react-router-dom";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";

export function ForbiddenPage() {
  return (
    <main className="page-shell flex min-h-screen items-center justify-center">
      <ErrorState
        title="Forbidden"
        description="Your current company membership or role does not allow this action."
        action={
          <Button asChild>
            <Link to="/app/companies">Back to companies</Link>
          </Button>
        }
      />
    </main>
  );
}

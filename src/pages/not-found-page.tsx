import { Link } from "react-router-dom";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <main className="page-shell flex min-h-screen items-center justify-center">
      <ErrorState
        title="Page not found"
        description="The route does not exist or is not wired yet."
        action={
          <Button asChild>
            <Link to="/app/companies">Go to app</Link>
          </Button>
        }
      />
    </main>
  );
}

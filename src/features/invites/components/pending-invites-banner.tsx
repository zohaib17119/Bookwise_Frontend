import { Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useMyInvites } from "@/features/invites/hooks/use-invites";

export function PendingInvitesBanner() {
  const invitesQuery = useMyInvites();
  const invites = invitesQuery.data ?? [];

  if (!invites.length) {
    return null;
  }

  return (
    <Alert
      title={`You have ${invites.length} pending team invitation${invites.length > 1 ? "s" : ""}`}
      description={
        <ul className="mt-2 space-y-2">
          {invites.map((invite) => (
            <li key={invite.id} className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4" />
                {invite.company.name} — {invite.role}
              </span>
              <Button asChild size="sm" variant="outline">
                <Link to={`/invites/${invite.token}`}>Review invite</Link>
              </Button>
            </li>
          ))}
        </ul>
      }
    />
  );
}

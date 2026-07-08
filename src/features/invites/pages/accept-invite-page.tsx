import { useNavigate, useParams } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { ApiErrorAlert } from "@/components/shared/api-error-alert";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { useAcceptInvite, useInvitePreview } from "@/features/invites/hooks/use-invites";
import { useAuthStore } from "@/features/auth/store/auth.store";

export function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const previewQuery = useInvitePreview(token);
  const acceptMutation = useAcceptInvite();

  if (previewQuery.isLoading) {
    return (
      <LoadingState
        title="Loading invite"
        description="Fetching invitation details..."
      />
    );
  }

  if (previewQuery.error || !previewQuery.data) {
    return (
      <ErrorState
        title="Invite not found"
        description="This invitation link is invalid or has expired."
      />
    );
  }

  const preview = previewQuery.data;

  const handleAccept = async () => {
    if (!token) return;
    const result = await acceptMutation.mutateAsync(token);
    navigate(`/app/company/${result.invite.companyId}/dashboard`, { replace: true });
  };

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center space-y-6 p-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">Join {preview.companyName}</h1>
        <p className="text-sm text-muted-foreground">
          {preview.inviterName} invited you as <strong>{preview.role}</strong>
        </p>
      </div>

      {preview.isExpired ? (
        <Alert
          variant="destructive"
          title="Invite expired"
          description="Ask your team admin to send a new invitation."
        />
      ) : null}

      <ApiErrorAlert error={acceptMutation.error} fallback="Unable to accept invite" />

      {!user ? (
        <div className="space-y-3">
          <p className="text-center text-sm text-muted-foreground">
            Sign in or create a free account with <strong>{preview.email}</strong> to accept.
          </p>
          <Button
            className="w-full"
            onClick={() =>
              navigate(`/login?redirect=${encodeURIComponent(`/invites/${token}`)}`)
            }
          >
            Sign in to accept
          </Button>
          <Button
            className="w-full"
            variant="secondary"
            onClick={() =>
              navigate(
                `/register?invite=${token}&email=${encodeURIComponent(preview.email)}`,
              )
            }
          >
            Create free account
          </Button>
        </div>
      ) : user.email.toLowerCase() !== preview.email.toLowerCase() ? (
        <Alert
          variant="destructive"
          title="Wrong account"
          description={`This invite was sent to ${preview.email}. You are signed in as ${user.email}.`}
        />
      ) : (
        <Button
          className="w-full"
          disabled={preview.isExpired || acceptMutation.isPending}
          isLoading={acceptMutation.isPending}
          onClick={handleAccept}
        >
          Accept invitation
        </Button>
      )}
    </div>
  );
}

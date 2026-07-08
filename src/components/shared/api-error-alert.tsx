import { Alert } from "@/components/ui/alert";
import { getApiErrorMessage } from "@/lib/api/error";

interface ApiErrorAlertProps {
  error?: unknown | null;
  fallback?: string;
  title?: string;
  description?: string;
  className?: string;
}

export function ApiErrorAlert({
  error,
  fallback = "Something went wrong",
  title,
  description,
  className,
}: ApiErrorAlertProps) {
  if (!error) {
    return null;
  }

  const message = title ?? getApiErrorMessage(error, fallback);

  return (
    <Alert
      className={className}
      description={description}
      title={message}
      variant="destructive"
    />
  );
}

import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface LoadingStateProps {
  title: string;
  description?: string;
  fullScreen?: boolean;
}

export function LoadingState({
  title,
  description,
  fullScreen = false,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "surface flex items-center gap-4 p-6",
        fullScreen && "m-6 min-h-[calc(100vh-3rem)] justify-center",
      )}
    >
      <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
      <div>
        <p className="font-medium">{title}</p>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
    </div>
  );
}

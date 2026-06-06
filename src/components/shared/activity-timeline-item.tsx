import { Clock3 } from "lucide-react";
import { ActivityActionBadge } from "@/components/shared/activity-action-badge";
import { ActivityActorBadge } from "@/components/shared/activity-actor-badge";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";

interface ActivityTimelineItemProps {
  title: string;
  description?: string | null;
  actor?: string | null;
  action?: string | null;
  createdAt?: string | null;
  className?: string;
}

export function ActivityTimelineItem({
  title,
  description,
  actor,
  action,
  createdAt,
  className,
}: ActivityTimelineItemProps) {
  return (
    <div className={cn("relative pl-8", className)}>
      <span className="absolute left-0 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Clock3 className="h-3 w-3" />
      </span>
      <div className="rounded-2xl border border-border/70 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold">{title}</h3>
          <ActivityActionBadge action={action} />
        </div>
        {description ? (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <ActivityActorBadge actor={actor} />
          <span>{formatDate(createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

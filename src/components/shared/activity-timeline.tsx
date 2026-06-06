import { EmptyState } from "@/components/shared/empty-state";
import { ActivityTimelineItem } from "@/components/shared/activity-timeline-item";

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string | null;
  actor?: string | null;
  action?: string | null;
  createdAt?: string | null;
}

interface ActivityTimelineProps {
  events: TimelineEvent[];
  emptyTitle?: string;
  emptyDescription?: string;
}

export function ActivityTimeline({
  events,
  emptyTitle = "No activity found",
  emptyDescription = "The backend did not return any timeline events for the selected scope.",
}: ActivityTimelineProps) {
  if (!events.length) {
    return <EmptyState description={emptyDescription} title={emptyTitle} />;
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div className="relative" key={event.id}>
          {index < events.length - 1 ? (
            <span className="absolute left-[7px] top-6 h-[calc(100%+0.5rem)] w-px bg-border" />
          ) : null}
          <ActivityTimelineItem
            action={event.action}
            actor={event.actor}
            createdAt={event.createdAt}
            description={event.description}
            title={event.title}
          />
        </div>
      ))}
    </div>
  );
}

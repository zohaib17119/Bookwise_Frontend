interface ActivityActorBadgeProps {
  actor?: string | null;
}

export function ActivityActorBadge({ actor }: ActivityActorBadgeProps) {
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700">
      {actor || "System"}
    </span>
  );
}

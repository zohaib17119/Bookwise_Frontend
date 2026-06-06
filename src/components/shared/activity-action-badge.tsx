interface ActivityActionBadgeProps {
  action?: string | null;
}

export function ActivityActionBadge({ action }: ActivityActionBadgeProps) {
  if (!action) {
    return null;
  }

  return (
    <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-secondary-foreground">
      {action}
    </span>
  );
}

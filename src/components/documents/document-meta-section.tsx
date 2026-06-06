interface DocumentMetaItem {
  label: string;
  value: string;
}

interface DocumentMetaSectionProps {
  title: string;
  items: DocumentMetaItem[];
}

export function DocumentMetaSection({
  title,
  items,
}: DocumentMetaSectionProps) {
  return (
    <div className="rounded-2xl border border-border/70 bg-white p-5">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </h3>
      <dl className="mt-4 space-y-3">
        {items.map((item) => (
          <div className="flex items-center justify-between gap-4" key={item.label}>
            <dt className="text-sm text-muted-foreground">{item.label}</dt>
            <dd className="text-sm font-medium text-right">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

import { cn } from "@/lib/utils/cn";

interface StatementRowProps {
  label: string;
  value: string;
  depth?: number;
  emphasize?: boolean;
}

export function StatementRow({
  label,
  value,
  depth = 0,
  emphasize = false,
}: StatementRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-lg px-2 py-1.5 text-sm",
        emphasize && "font-semibold",
      )}
    >
      <span style={{ paddingLeft: `${depth * 16}px` }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

import { cn } from "@/lib/utils/cn";

interface BankTransactionStatusBadgeProps {
  isMatched?: boolean;
  isCleared?: boolean;
}

export function BankTransactionStatusBadge({
  isMatched,
  isCleared,
}: BankTransactionStatusBadgeProps) {
  const label = isCleared ? "Cleared" : isMatched ? "Matched" : "Unmatched";
  const classes = isCleared
    ? "bg-emerald-50 text-emerald-700"
    : isMatched
      ? "bg-cyan-50 text-cyan-700"
      : "bg-slate-100 text-slate-700";

  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", classes)}>
      {label}
    </span>
  );
}

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export type ExportFormat = "csv" | "xlsx" | "pdf";

interface ExportActionsProps {
  onExport?: (format: ExportFormat) => Promise<void> | void;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
}

export function ExportActions({
  onExport,
  disabled,
  className,
  compact = false,
}: ExportActionsProps) {
  const [activeFormat, setActiveFormat] = useState<ExportFormat | null>(null);

  async function handleExport(format: ExportFormat) {
    if (!onExport) {
      return;
    }

    setActiveFormat(format);

    try {
      await onExport(format);
    } finally {
      setActiveFormat(null);
    }
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {!compact ? (
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Export
        </span>
      ) : null}
      {(["csv", "xlsx", "pdf"] as ExportFormat[]).map((format) => (
        <Button
          disabled={disabled || !onExport}
          isLoading={activeFormat === format}
          key={format}
          onClick={() => handleExport(format)}
          size="sm"
          type="button"
          variant="secondary"
        >
          <Download className="mr-2 h-4 w-4" />
          {format.toUpperCase()}
        </Button>
      ))}
    </div>
  );
}

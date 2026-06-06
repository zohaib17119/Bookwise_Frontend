import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SnapshotViewerProps {
  title: string;
  value: unknown;
}

export function SnapshotViewer({ title, value }: SnapshotViewerProps) {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-2xl border border-border/70 bg-white">
      <button
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="text-sm font-semibold">{title}</span>
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {open ? (
        <pre className="overflow-x-auto border-t border-border/70 bg-slate-50 px-4 py-4 text-xs leading-6 text-slate-700">
          {JSON.stringify(value ?? {}, null, 2)}
        </pre>
      ) : null}
    </section>
  );
}

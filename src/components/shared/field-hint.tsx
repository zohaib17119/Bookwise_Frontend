import { HelpCircle } from "lucide-react";

interface FieldHintProps {
  text: string;
}

export function FieldHint({ text }: FieldHintProps) {
  return (
    <span className="group relative inline-flex align-middle">
      <HelpCircle
        aria-label="Help"
        className="h-3.5 w-3.5 cursor-help text-muted-foreground"
      />
      <span
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-56 -translate-x-1/2 rounded-md border bg-popover px-2.5 py-2 text-[11px] font-normal normal-case leading-snug text-popover-foreground shadow-md group-hover:block group-focus-within:block"
        role="tooltip"
      >
        {text}
      </span>
    </span>
  );
}

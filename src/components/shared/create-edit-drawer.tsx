import type { PropsWithChildren, ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface CreateEditDrawerProps extends PropsWithChildren {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  footer?: ReactNode;
}

export function CreateEditDrawer({
  open,
  title,
  description,
  onClose,
  footer,
  children,
}: CreateEditDrawerProps) {
  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm transition",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl translate-x-full flex-col border-l bg-background shadow-2xl transition",
          open && "translate-x-0",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <Button onClick={onClose} size="icon" type="button" variant="ghost">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        {footer ? <div className="border-t px-6 py-4">{footer}</div> : null}
      </aside>
    </>
  );
}

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface ConfirmDeleteDialogProps {
  open: boolean;
  title: string;
  description: string;
  isPending?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteDialog({
  open,
  title,
  description,
  isPending,
  onClose,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm transition",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 scale-95 p-4 opacity-0 transition",
          open && "scale-100 opacity-100",
        )}
      >
        <div className="surface p-6">
          <div className="flex gap-4">
            <div className="rounded-2xl bg-destructive/10 p-3 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button onClick={onClose} type="button" variant="ghost">
              Cancel
            </Button>
            <Button
              isLoading={isPending}
              onClick={onConfirm}
              type="button"
              variant="destructive"
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

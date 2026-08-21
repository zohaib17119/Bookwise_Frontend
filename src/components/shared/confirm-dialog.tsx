import { AlertTriangle, Send } from "lucide-react";
import type { ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useSubmitLock } from "@/hooks/use-submit-lock";
import { cn } from "@/lib/utils/cn";

type ConfirmTone = "default" | "destructive";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  isPending?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  isPending = false,
  errorMessage = null,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  const isDestructive = tone === "destructive";
  const handleConfirm = useSubmitLock(onConfirm, isPending);

  if (!open) {
    return null;
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm transition",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={isPending ? undefined : onClose}
      />
      <div
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 scale-95 p-4 opacity-0 transition",
          open && "scale-100 opacity-100",
        )}
      >
        <div className="surface p-6">
          <div className="flex gap-4">
            <div
              className={cn(
                "rounded-2xl p-3",
                isDestructive ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
              )}
            >
              {isDestructive ? <AlertTriangle className="h-5 w-5" /> : <Send className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold">{title}</h3>
              <div className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{description}</div>
              {errorMessage ? (
                <div className="mt-3">
                  <Alert title={errorMessage} variant="destructive" />
                </div>
              ) : null}
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button disabled={isPending} onClick={onClose} type="button" variant="ghost">
              {cancelLabel}
            </Button>
            <Button
              isLoading={isPending}
              onClick={handleConfirm}
              type="button"
              variant={isDestructive ? "destructive" : "primary"}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

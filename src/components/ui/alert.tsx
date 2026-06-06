import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type AlertVariant = "default" | "destructive" | "success";

const iconMap = {
  default: Info,
  destructive: AlertTriangle,
  success: CheckCircle2,
} satisfies Record<AlertVariant, typeof Info>;

const variantClasses: Record<AlertVariant, string> = {
  default: "border-border bg-white text-foreground",
  destructive: "border-destructive/30 bg-destructive/5 text-destructive",
  success: "border-emerald-300 bg-emerald-50 text-emerald-700",
};

interface AlertProps {
  title: string;
  description?: string;
  variant?: AlertVariant;
}

export function Alert({ title, description, variant = "default" }: AlertProps) {
  const Icon = iconMap[variant];

  return (
    <div className={cn("rounded-xl border px-4 py-3", variantClasses[variant])}>
      <div className="flex gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="text-sm font-medium">{title}</p>
          {description ? <p className="mt-1 text-sm opacity-80">{description}</p> : null}
        </div>
      </div>
    </div>
  );
}

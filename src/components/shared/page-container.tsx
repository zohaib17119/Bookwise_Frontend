import type { PropsWithChildren, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface PageContainerProps extends PropsWithChildren {
  className?: string;
  header?: ReactNode;
}

export function PageContainer({
  className,
  header,
  children,
}: PageContainerProps) {
  return (
    <section className={cn("space-y-6", className)}>
      {header}
      {children}
    </section>
  );
}

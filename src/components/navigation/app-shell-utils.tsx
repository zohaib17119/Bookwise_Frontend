import type { ReactNode } from "react";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export const SIDEBAR_WIDTH_EXPANDED = 280;
export const SIDEBAR_WIDTH_COLLAPSED = 72;

export function getSidebarOffset(isDesktop: boolean) {
  return isDesktop ? SIDEBAR_WIDTH_COLLAPSED : 0;
}

interface SidebarCollapseButtonProps {
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
}

export function SidebarCollapseButton({
  collapsed,
  onToggle,
  className,
}: SidebarCollapseButtonProps) {
  return (
    <Button
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      className={cn("hidden shrink-0 text-slate-300 hover:text-white lg:inline-flex", className)}
      onClick={onToggle}
      size="icon"
      type="button"
      variant="ghost"
    >
      {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
    </Button>
  );
}

interface AppShellMainProps {
  children: ReactNode;
  sidebarOffset?: number;
  className?: string;
}

export function AppShellMain({ children, sidebarOffset = 0, className }: AppShellMainProps) {
  const hasOffset = sidebarOffset > 0;

  return (
    <div
      className={cn(
        "min-h-screen min-w-0 transition-[margin-left,width] duration-200",
        !hasOffset && "w-full",
        className,
      )}
      style={
        hasOffset
          ? { marginLeft: sidebarOffset, width: `calc(100% - ${sidebarOffset}px)` }
          : undefined
      }
    >
      {children}
    </div>
  );
}

import type { ReactNode } from "react";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export const SIDEBAR_WIDTH_EXPANDED = 280;
export const SIDEBAR_WIDTH_COLLAPSED = 72;

export function getSidebarOffset(collapsed: boolean, isDesktop: boolean) {
  if (!isDesktop) return 0;
  return collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;
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
  sidebarOffset: number;
  className?: string;
}

export function AppShellMain({ children, sidebarOffset, className }: AppShellMainProps) {
  return (
    <div
      className={cn("min-h-screen transition-[margin-left] duration-200", className)}
      style={{ marginLeft: sidebarOffset > 0 ? sidebarOffset : undefined }}
    >
      {children}
    </div>
  );
}

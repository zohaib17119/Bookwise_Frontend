import { useLayoutEffect, useState, type CSSProperties, type RefObject } from "react";

export function useFixedMenuStyle(
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  options?: { minWidth?: number; maxHeight?: number },
) {
  const minWidth = options?.minWidth ?? 280;
  const maxHeight = options?.maxHeight ?? 320;
  const [style, setStyle] = useState<CSSProperties>({});
  const [openUp, setOpenUp] = useState(false);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    const update = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const shouldOpenUp = spaceBelow < maxHeight && rect.top > spaceBelow;
      setOpenUp(shouldOpenUp);
      setStyle({
        position: "fixed",
        left: Math.min(rect.left, window.innerWidth - minWidth - 8),
        width: Math.max(rect.width, minWidth),
        maxHeight,
        zIndex: 80,
        ...(shouldOpenUp
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [maxHeight, minWidth, open, triggerRef]);

  return { style, openUp };
}

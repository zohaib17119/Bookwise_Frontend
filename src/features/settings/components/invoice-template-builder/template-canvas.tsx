import {
  COLUMN_LABELS,
  elementPreviewLabel,
  getBoxChildren,
  getTopLevelElements,
  inferYAnchor,
  isCanvasContainer,
  resolveCanvasHeight,
  resolveCanvasTop,
  SAMPLE_PREVIEW_ROW_COUNT,
  type InvoiceTemplateLayout,
  type TemplateElement,
} from "@/features/settings/types/invoice-template.types";

interface TemplateCanvasProps {
  layout: InvoiceTemplateLayout;
  selectedId: string | null;
  dragId: string | null;
  resolvedLogoUrl: string;
  canManage: boolean;
  onSelect: (id: string) => void;
  onPointerDown: (event: React.PointerEvent, element: TemplateElement) => void;
  onPointerMove: (event: React.PointerEvent) => void;
  onPointerUp: () => void;
}

export function TemplateCanvas({
  layout,
  selectedId,
  dragId,
  resolvedLogoUrl,
  canManage,
  onSelect,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: TemplateCanvasProps) {
  const topLevel = getTopLevelElements(layout.elements).filter((el) => el.visible !== false);
  const lineTable = topLevel.find((el) => el.kind === "lineTable");

  return (
    <div
      className="relative mx-auto aspect-[210/297] w-full max-w-[640px] overflow-hidden rounded-xl border bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_40%)] shadow-sm"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {topLevel.map((element) => {
        const mediaUrl =
          element.kind === "letterhead"
            ? layout.letterheadUrl
            : element.kind === "logo"
              ? resolvedLogoUrl
              : element.kind === "footer"
                ? layout.footerImageUrl
                : null;

        const isContainer = isCanvasContainer(element);
        const children =
          element.kind === "box" || element.kind === "footer"
            ? getBoxChildren(layout.elements, element.id)
            : [];
        const boxStyle = element.style ?? {};
        const canvasTop = resolveCanvasTop(element, layout);
        const canvasHeight = resolveCanvasHeight(element);
        const anchor = inferYAnchor(element, lineTable?.y ?? 38);

        return (
          <div
            className={`absolute overflow-hidden p-1.5 text-[10px] ${
              isContainer
                ? `cursor-grab rounded-md border border-dashed bg-white/95 shadow-sm ${
                    selectedId === element.id
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-primary/30"
                  } ${dragId === element.id ? "cursor-grabbing" : ""}`
                : selectedId === element.id
                  ? "rounded ring-2 ring-primary/30"
                  : ""
            } ${element.repeatOnEveryPage ? "ring-1 ring-violet-300" : ""}`}
            key={element.id}
            onClick={(event) => {
              event.stopPropagation();
              onSelect(element.id);
            }}
            onPointerDown={(event) => {
              if (!isContainer) return;
              event.stopPropagation();
              onSelect(element.id);
              onPointerDown(event, element);
            }}
            style={{
              left: `${element.x}%`,
              top: `${canvasTop}%`,
              width: `${element.width}%`,
              height: canvasHeight ?? "auto",
              minHeight: element.kind === "lineTable" ? undefined : isContainer ? "8%" : "4%",
              ...(element.kind === "box"
                ? {
                    border: boxStyle.borderColor ? `1px solid ${boxStyle.borderColor}` : undefined,
                    backgroundColor: boxStyle.backgroundColor,
                    padding: boxStyle.padding,
                  }
                : {}),
            }}
            title={
              anchor === "afterLineTable"
                ? `Offset ${element.y}% after table end (shown at ${Math.round(canvasTop)}%)`
                : anchor === "pageBottom"
                  ? `${element.y}% from page bottom`
                  : undefined
            }
          >
            {element.kind === "box" || element.kind === "footer" ? (
              <div className="flex h-full flex-col gap-0.5">
                {element.titleBinding || element.content ? (
                  <p
                    className="mb-1 font-semibold uppercase tracking-wide text-muted-foreground"
                    style={{
                      fontSize: boxStyle.fontSize ? `${boxStyle.fontSize}px` : undefined,
                      color: boxStyle.color,
                    }}
                  >
                    {elementPreviewLabel(element)}
                  </p>
                ) : null}
                {children.map((child) => (
                  <button
                    className={`block w-full truncate rounded px-1 py-0.5 text-left hover:bg-slate-100 ${
                      selectedId === child.id ? "bg-primary/10 ring-1 ring-primary/40" : ""
                    }`}
                    key={child.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect(child.id);
                    }}
                    style={{
                      fontSize: child.style?.fontSize ? `${child.style.fontSize}px` : undefined,
                      fontWeight: child.style?.fontWeight === "bold" ? 700 : 400,
                      color: child.style?.color,
                      textAlign: child.style?.textAlign,
                    }}
                    type="button"
                  >
                    {elementPreviewLabel(child)}
                  </button>
                ))}
                {element.kind === "box" && !children.length ? (
                  <p className="text-muted-foreground">Select box, then add fields from palette</p>
                ) : null}
                {element.repeatOnEveryPage ? (
                  <p className="mt-1 text-[9px] text-violet-600">Repeats on every page</p>
                ) : null}
              </div>
            ) : mediaUrl ? (
              <img
                alt={element.kind}
                className="h-[calc(100%-1rem)] w-full object-contain"
                draggable={false}
                src={mediaUrl}
              />
            ) : element.kind === "lineTable" ? (
              <div>
                <p className="font-medium text-slate-700">
                  Line items ({SAMPLE_PREVIEW_ROW_COUNT} sample rows)
                </p>
                <p className="text-muted-foreground">
                  {layout.columns.map((column) => COLUMN_LABELS[column]).join(" → ")}
                </p>
                {element.maxHeight ? (
                  <p className="mt-1 text-[9px] text-amber-700">Max height {element.maxHeight}%</p>
                ) : null}
              </div>
            ) : (
              <p
                className="truncate font-medium"
                style={{
                  fontSize: element.style?.fontSize ? `${element.style.fontSize}px` : undefined,
                  fontWeight: element.style?.fontWeight === "bold" ? 700 : 400,
                  color: element.style?.color,
                }}
              >
                {elementPreviewLabel(element)}
              </p>
            )}
          </div>
        );
      })}
      {!canManage ? (
        <p className="absolute bottom-2 right-2 rounded bg-white/90 px-2 py-1 text-[10px] text-muted-foreground">
          View only
        </p>
      ) : null}
    </div>
  );
}

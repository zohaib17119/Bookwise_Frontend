import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

const CREATE_SENTINEL = "__create__";
const CREATE_ACTION_PREFIX = "__create__:";

export interface ItemSelectOption {
  id: string;
  label: string;
  secondary?: string;
}

export interface ItemSelectCreateAction {
  id: string;
  label: string;
  onSelect: () => void;
}

interface ItemSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: ItemSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onCreateNew?: () => void;
  createLabel?: string;
  /** When set, these rows replace the single onCreateNew row. */
  createActions?: ItemSelectCreateAction[];
}

function rankScore(option: ItemSelectOption, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) {
    return 0;
  }

  const label = option.label.toLowerCase();
  const secondary = (option.secondary ?? "").toLowerCase();

  if (label === q || secondary === q) return 300;
  if (label.startsWith(q) || secondary.startsWith(q)) return 200;
  if (label.includes(q) || secondary.includes(q)) return 100;
  return -1;
}

function optionDisplay(option: ItemSelectOption) {
  return option.secondary ? `${option.label} (${option.secondary})` : option.label;
}

function isCreateRowId(id: string) {
  return id === CREATE_SENTINEL || id.startsWith(CREATE_ACTION_PREFIX);
}

export function ItemSelect({
  value,
  onChange,
  options,
  placeholder = "Select item…",
  disabled = false,
  className,
  onCreateNew,
  createLabel = "Create new item…",
  createActions,
}: ItemSelectProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);

  const selected = useMemo(
    () => options.find((option) => option.id === value) ?? null,
    [options, value],
  );

  const rankedOptions = useMemo(() => {
    const scored = options
      .map((option) => ({ option, score: rankScore(option, query) }))
      .filter((entry) => entry.score >= 0);

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.option.label.localeCompare(b.option.label);
    });

    return scored.map((entry) => entry.option);
  }, [options, query]);

  const createRows = useMemo(() => {
    if (createActions?.length) {
      return createActions.map((action) => ({
        id: `${CREATE_ACTION_PREFIX}${action.id}`,
        label: action.label,
        secondary: undefined as string | undefined,
        onSelect: action.onSelect,
      }));
    }
    if (onCreateNew) {
      return [
        {
          id: CREATE_SENTINEL,
          label: createLabel,
          secondary: undefined as string | undefined,
          onSelect: onCreateNew,
        },
      ];
    }
    return [];
  }, [createActions, createLabel, onCreateNew]);

  const visibleRows = useMemo(
    () => [
      ...rankedOptions,
      ...createRows.map(({ id, label, secondary }) => ({ id, label, secondary })),
    ],
    [createRows, rankedOptions],
  );

  useEffect(() => {
    if (!open) {
      setQuery("");
      setHighlightIndex(0);
      return;
    }
    setHighlightIndex(0);
  }, [open, query]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const selectOption = (optionId: string) => {
    if (isCreateRowId(optionId)) {
      const action = createRows.find((row) => row.id === optionId);
      action?.onSelect();
      setOpen(false);
      return;
    }
    onChange(optionId);
    setOpen(false);
  };

  const displayValue = open
    ? query
    : selected
      ? optionDisplay(selected)
      : "";

  return (
    <div className={cn("relative", className)} ref={rootRef}>
      <Input
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={open}
        autoComplete="off"
        className="h-9 w-full rounded-lg border border-border bg-white text-sm transition-all focus:border-primary"
        disabled={disabled}
        onChange={(event) => {
          setQuery(event.target.value);
          if (!open) setOpen(true);
        }}
        onFocus={() => {
          if (!disabled) setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            setOpen(false);
            return;
          }

          if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
            setOpen(true);
            return;
          }

          if (!open) return;

          if (event.key === "ArrowDown") {
            event.preventDefault();
            setHighlightIndex((index) => Math.min(index + 1, Math.max(visibleRows.length - 1, 0)));
            return;
          }

          if (event.key === "ArrowUp") {
            event.preventDefault();
            setHighlightIndex((index) => Math.max(index - 1, 0));
            return;
          }

          if (event.key === "Enter") {
            event.preventDefault();
            const target = visibleRows[highlightIndex];
            if (target) selectOption(target.id);
          }
        }}
        placeholder={placeholder}
        role="combobox"
        value={displayValue}
      />

      {open && !disabled ? (
        <ul
          className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-xl border bg-white py-1 shadow-lg"
          id={listboxId}
          role="listbox"
        >
          {rankedOptions.length === 0 && createRows.length === 0 ? (
            <li className="px-4 py-2 text-sm text-muted-foreground">No matches</li>
          ) : null}

          {visibleRows.map((option, index) => {
            const isCreate = isCreateRowId(option.id);
            const isActive = index === highlightIndex;
            const isSelected = !isCreate && option.id === value;
            const isFirstCreate =
              isCreate && (index === 0 || !isCreateRowId(visibleRows[index - 1]?.id ?? ""));

            return (
              <li key={option.id} role="option" aria-selected={isSelected || isActive}>
                <button
                  className={cn(
                    "flex w-full px-4 py-2 text-left text-sm hover:bg-slate-50",
                    isActive && "bg-slate-50",
                    isSelected && "font-medium text-primary",
                    isCreate && "text-primary",
                    isFirstCreate && "border-t border-slate-100",
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectOption(option.id)}
                  onMouseEnter={() => setHighlightIndex(index)}
                  type="button"
                >
                  {isCreate ? option.label : optionDisplay(option)}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

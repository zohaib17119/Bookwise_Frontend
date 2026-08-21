import { useCallback, useEffect, useMemo, useState } from "react";

export type TableViewColumnDef = {
  id: string;
  label: string;
  defaultVisible?: boolean;
};

export type TableViewState = {
  order: string[];
  hidden: string[];
};

function storageKey(tableId: string, companyId: string, userId: string) {
  return `bookwise.table-view.${tableId}:${companyId}:${userId}`;
}

function readStored(key: string): TableViewState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TableViewState;
    if (!Array.isArray(parsed.order) || !Array.isArray(parsed.hidden)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function defaultState(columns: TableViewColumnDef[]): TableViewState {
  return {
    order: columns.map((column) => column.id),
    hidden: columns.filter((column) => column.defaultVisible === false).map((column) => column.id),
  };
}

function normalizeState(columns: TableViewColumnDef[], stored: TableViewState | null): TableViewState {
  const defaults = defaultState(columns);
  const known = new Set(columns.map((column) => column.id));
  const order = [
    ...(stored?.order ?? []).filter((id) => known.has(id)),
    ...defaults.order.filter((id) => !(stored?.order ?? []).includes(id)),
  ];
  const hidden = (stored?.hidden ?? defaults.hidden).filter((id) => known.has(id));
  return { order, hidden };
}

export function useTableViewPreferences(
  tableId: string,
  companyId: string | undefined,
  userId: string | undefined,
  columns: TableViewColumnDef[],
) {
  const key =
    companyId && userId ? storageKey(tableId, companyId, userId) : null;
  const columnsSignature = columns.map((column) => column.id).join(",");

  const [state, setState] = useState<TableViewState>(() =>
    normalizeState(columns, key ? readStored(key) : null),
  );

  useEffect(() => {
    setState(normalizeState(columns, key ? readStored(key) : null));
    // columnsSignature stands in for column id set changes (e.g. FBR column).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, columnsSignature]);

  const persist = useCallback(
    (next: TableViewState) => {
      setState(next);
      if (!key) return;
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // ignore quota / private mode
      }
    },
    [key],
  );

  const visibleColumnIds = useMemo(
    () => state.order.filter((id) => !state.hidden.includes(id)),
    [state.hidden, state.order],
  );

  const toggleVisible = useCallback(
    (columnId: string, visible: boolean) => {
      const hidden = visible
        ? state.hidden.filter((id) => id !== columnId)
        : state.hidden.includes(columnId)
          ? state.hidden
          : [...state.hidden, columnId];
      // Keep at least one column visible.
      if (state.order.filter((id) => !hidden.includes(id)).length === 0) return;
      persist({ ...state, hidden });
    },
    [persist, state],
  );

  const moveColumn = useCallback(
    (columnId: string, direction: "up" | "down") => {
      const index = state.order.indexOf(columnId);
      if (index < 0) return;
      const swapWith = direction === "up" ? index - 1 : index + 1;
      if (swapWith < 0 || swapWith >= state.order.length) return;
      const order = [...state.order];
      const temp = order[index]!;
      order[index] = order[swapWith]!;
      order[swapWith] = temp;
      persist({ ...state, order });
    },
    [persist, state],
  );

  const reset = useCallback(() => {
    persist(defaultState(columns));
  }, [columns, persist]);

  return {
    order: state.order,
    hidden: state.hidden,
    visibleColumnIds,
    toggleVisible,
    moveColumn,
    reset,
  };
}

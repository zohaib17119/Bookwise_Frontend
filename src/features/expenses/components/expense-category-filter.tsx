import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { Account } from "@/features/accounts/types/account.types";
import { useFixedMenuStyle } from "@/features/expenses/components/use-fixed-menu-style";

interface ExpenseCategoryFilterProps {
  accounts: Account[];
  includedIds: Set<string> | null;
  onChange: (includedIds: Set<string> | null) => void;
}

export function ExpenseCategoryFilter({ accounts, includedIds, onChange }: ExpenseCategoryFilterProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const { style } = useFixedMenuStyle(open, triggerRef, { minWidth: 280, maxHeight: 360 });

  const categories = useMemo(
    () =>
      accounts.filter(
        (account) =>
          account.isActive && (account.type === "EXPENSE" || account.type === "COST_OF_GOODS_SOLD"),
      ),
    [accounts],
  );

  const allIds = useMemo(() => categories.map((account) => account.id), [categories]);
  const checkedCount =
    includedIds === null ? allIds.length : allIds.filter((id) => includedIds.has(id)).length;

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const isChecked = (id: string) => (includedIds === null ? true : includedIds.has(id));

  return (
    <div className="relative shrink-0">
      <Button
        onClick={() => setOpen((value) => !value)}
        ref={triggerRef}
        type="button"
        variant="secondary"
      >
        Categories ({checkedCount}/{allIds.length || 0})
      </Button>
      {open
        ? createPortal(
            <div
              className="rounded-xl border bg-white p-3 shadow-lg"
              ref={menuRef}
              style={style}
            >
              <div className="mb-2 flex gap-2">
                <Button onClick={() => onChange(null)} size="sm" type="button" variant="ghost">
                  All
                </Button>
                <Button onClick={() => onChange(new Set())} size="sm" type="button" variant="ghost">
                  None
                </Button>
              </div>
              <ul className="max-h-72 space-y-1 overflow-y-auto">
                {categories.map((account) => (
                  <li key={account.id}>
                    <label className="flex min-h-9 items-center gap-2 rounded-lg px-1 py-2 text-sm leading-5 hover:bg-slate-50">
                      <Checkbox
                        checked={isChecked(account.id)}
                        onChange={(event) => {
                          const next = new Set(includedIds === null ? allIds : includedIds);
                          if (event.target.checked) {
                            next.add(account.id);
                          } else {
                            next.delete(account.id);
                          }
                          if (next.size === allIds.length) {
                            onChange(null);
                          } else {
                            onChange(next);
                          }
                        }}
                      />
                      {(account.code ? `${account.code} ` : "") + account.name}
                    </label>
                  </li>
                ))}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

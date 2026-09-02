import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateAccount } from "@/features/accounts/hooks/use-accounts";
import { nextExpenseAccountCode } from "@/features/accounts/utils/payment-account-options";
import type { Account } from "@/features/accounts/types/account.types";
import { useFixedMenuStyle } from "@/features/expenses/components/use-fixed-menu-style";
import { cn } from "@/lib/utils/cn";

interface ExpenseCategorySelectProps {
  companyId: string | undefined;
  accounts: Account[];
  value: string;
  onChange: (accountId: string) => void;
  className?: string;
}

export function ExpenseCategorySelect({
  companyId,
  accounts,
  value,
  onChange,
  className,
}: ExpenseCategorySelectProps) {
  const listboxId = useId();
  const triggerRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const createMutation = useCreateAccount(companyId);
  const { style } = useFixedMenuStyle(open, triggerRef, { minWidth: 280, maxHeight: 360 });

  const options = useMemo(
    () =>
      accounts.filter(
        (account) =>
          account.isActive && (account.type === "EXPENSE" || account.type === "COST_OF_GOODS_SOLD"),
      ),
    [accounts],
  );

  const selected = options.find((account) => account.id === value);
  const selectedLabel = selected
    ? `${selected.code ? `${selected.code} ` : ""}${selected.name}`
    : "";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((account) => {
      const label = `${account.code ?? ""} ${account.name}`.toLowerCase();
      return label.includes(q);
    });
  }, [options, query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setCreating(false);
      setNewName("");
    }
  }, [open]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const optionLabel = (account: Account) =>
    `${account.code ? `${account.code} ` : ""}${account.name}`;

  return (
    <div className={cn("relative min-w-[180px]", className)}>
      <Input
        aria-controls={listboxId}
        aria-expanded={open}
        autoComplete="off"
        className="h-9 w-full rounded-lg border border-border bg-white text-sm"
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Select category"
        ref={triggerRef}
        role="combobox"
        value={open ? query : selectedLabel}
      />
      {open
        ? createPortal(
            <div
              className="overflow-hidden rounded-xl border bg-white shadow-lg"
              id={listboxId}
              ref={menuRef}
              style={style}
            >
              <ul className="max-h-52 overflow-y-auto py-1" role="listbox">
                {filtered.length === 0 ? (
                  <li className="px-4 py-2 text-sm text-muted-foreground">No matches</li>
                ) : (
                  filtered.map((account) => (
                    <li key={account.id} role="option">
                      <button
                        className={cn(
                          "flex min-h-9 w-full px-4 py-2 text-left text-sm leading-5 hover:bg-slate-50",
                          account.id === value && "font-medium text-primary",
                        )}
                        onClick={() => {
                          onChange(account.id);
                          setOpen(false);
                        }}
                        onMouseDown={(event) => event.preventDefault()}
                        type="button"
                      >
                        {optionLabel(account)}
                      </button>
                    </li>
                  ))
                )}
              </ul>
              <div className="border-t border-slate-100 p-2">
                {creating ? (
                  <div className="space-y-2">
                    <Input
                      autoFocus
                      onChange={(event) => setNewName(event.target.value)}
                      placeholder="Category name"
                      value={newName}
                    />
                    {createMutation.error ? (
                      <p className="text-xs text-destructive">{createMutation.error.message}</p>
                    ) : null}
                    <div className="flex gap-2">
                      <Button
                        isLoading={createMutation.isPending}
                        onClick={async () => {
                          const trimmed = newName.trim();
                          if (!trimmed || !companyId) return;
                          const created = await createMutation.mutateAsync({
                            code: nextExpenseAccountCode(accounts),
                            name: trimmed,
                            type: "EXPENSE",
                            normalSide: "DEBIT",
                            isActive: true,
                          });
                          onChange(created.id);
                          setOpen(false);
                        }}
                        size="sm"
                        type="button"
                      >
                        Save
                      </Button>
                      <Button
                        onClick={() => {
                          setCreating(false);
                          setNewName("");
                          createMutation.reset();
                        }}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="w-full rounded-lg px-2 py-1.5 text-left text-sm font-medium text-primary hover:bg-slate-50"
                    onClick={() => setCreating(true)}
                    onMouseDown={(event) => event.preventDefault()}
                    type="button"
                  >
                    New category
                  </button>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

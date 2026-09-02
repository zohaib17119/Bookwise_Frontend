import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { DashboardCashAccount } from "@/features/dashboard/types/dashboard.types";
import { formatCurrency } from "@/lib/utils/format";

interface CashAccountsPanelProps {
  accounts: DashboardCashAccount[];
  currency: string;
  canManage: boolean;
  isPending?: boolean;
  onToggle: (accountId: string, included: boolean) => void;
  onIncludeAll: () => void;
  onClose: () => void;
}

export function CashAccountsPanel({
  accounts,
  currency,
  canManage,
  isPending,
  onToggle,
  onIncludeAll,
  onClose,
}: CashAccountsPanelProps) {
  const includedTotal = accounts
    .filter((account) => account.included)
    .reduce((sum, account) => sum + account.balance, 0);

  return (
    <div className="surface space-y-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">Cash Balance accounts</p>
          <p className="text-sm text-muted-foreground">
            Choose which cash and bank accounts count toward the dashboard total. Current total{" "}
            {formatCurrency(includedTotal, currency)}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button disabled={!canManage || isPending} onClick={onIncludeAll} type="button" variant="secondary">
            Include all
          </Button>
          <Button onClick={onClose} type="button" variant="ghost">
            Close
          </Button>
        </div>
      </div>
      <ul className="divide-y rounded-xl border">
        {accounts.map((account) => (
          <li className="flex items-center justify-between gap-3 px-4 py-3" key={account.id}>
            <label className="flex items-center gap-3 text-sm">
              <Checkbox
                checked={account.included}
                disabled={!canManage || isPending}
                onChange={(event) => onToggle(account.id, event.target.checked)}
              />
              <span>
                {(account.code ? `${account.code} ` : "") + account.name}
              </span>
            </label>
            <span className="text-sm font-medium">{formatCurrency(account.balance, currency)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

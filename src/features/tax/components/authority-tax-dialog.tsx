import { useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CreateEditDrawer } from "@/components/shared/create-edit-drawer";
import { FormField } from "@/components/shared/form-field";
import { formatCurrency } from "@/lib/utils/format";

export type AuthorityTaxDialogKind =
  | "invoice-sales-tax"
  | "invoice-income-wht"
  | "bill-purchase-tax"
  | "bill-income-wht";

export interface AuthorityTaxDialogProps {
  open: boolean;
  kind: AuthorityTaxDialogKind | null;
  title: string;
  description: string;
  amountLabel: string;
  amount: number;
  currency: string;
  needsBank: boolean;
  needsPercent: boolean;
  savedPercent: string | null;
  carryForwardBalance?: number;
  bankAccounts: Array<{ id: string; code?: string | null; name: string }>;
  isPending?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onConfirm: (values: {
    paymentDate: string;
    bankAccountId?: string;
    carryForwardMaxPercent?: string;
  }) => Promise<void>;
}

export function AuthorityTaxDialog({
  open,
  kind,
  title,
  description,
  amountLabel,
  amount,
  currency,
  needsBank,
  needsPercent,
  savedPercent,
  carryForwardBalance = 0,
  bankAccounts,
  isPending,
  errorMessage,
  onClose,
  onConfirm,
}: AuthorityTaxDialogProps) {
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [bankAccountId, setBankAccountId] = useState("");
  const [percent, setPercent] = useState(savedPercent ?? "90");

  const preview = useMemo(() => {
    if (kind !== "invoice-sales-tax") {
      return { cfUsed: 0, cashUsed: needsBank ? amount : 0 };
    }
    const pct = Number(needsPercent ? percent : savedPercent ?? percent) || 0;
    const requestedCf = Math.round(((amount * pct) / 100) * 100) / 100;
    const cfUsed = Math.min(requestedCf, carryForwardBalance, amount);
    const cashUsed = Math.round((amount - cfUsed) * 100) / 100;
    return { cfUsed, cashUsed };
  }, [amount, carryForwardBalance, kind, needsBank, needsPercent, percent, savedPercent]);

  if (!open || !kind) return null;

  return (
    <CreateEditDrawer
      description={description}
      onClose={onClose}
      open={open}
      title={title}
    >
      <div className="space-y-4 p-1">
        {errorMessage ? <Alert title={errorMessage} variant="destructive" /> : null}
        <p className="text-sm">
          {amountLabel}:{" "}
          <span className="font-semibold tabular-nums">{formatCurrency(amount, currency)}</span>
        </p>
        {kind === "invoice-sales-tax" ? (
          <div className="rounded-lg border border-border/70 bg-slate-50 p-3 text-sm">
            <p>
              Carry forward available:{" "}
              <span className="tabular-nums">{formatCurrency(carryForwardBalance, currency)}</span>
            </p>
            <p className="mt-1">
              From carry forward:{" "}
              <span className="tabular-nums">{formatCurrency(preview.cfUsed, currency)}</span>
            </p>
            <p>
              From cash / bank:{" "}
              <span className="tabular-nums">{formatCurrency(preview.cashUsed, currency)}</span>
            </p>
          </div>
        ) : null}
        {needsPercent ? (
          <FormField label="Max % from sales tax carry forward">
            <Input
              max={100}
              min={0}
              onChange={(event) => setPercent(event.target.value)}
              step="0.01"
              type="number"
              value={percent}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Saved to company tax settings after confirm. Change later under Tax Settings.
            </p>
          </FormField>
        ) : null}
        <FormField label="Payment date">
          <Input
            onChange={(event) => setPaymentDate(event.target.value)}
            type="date"
            value={paymentDate}
          />
        </FormField>
        {needsBank && preview.cashUsed > 0 ? (
          <FormField label="Bank / cash account">
            <Select
              onChange={(event) => setBankAccountId(event.target.value)}
              value={bankAccountId}
            >
              <option value="">Select account</option>
              {bankAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.code ? `${account.code} · ` : ""}
                  {account.name}
                </option>
              ))}
            </Select>
          </FormField>
        ) : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={onClose} type="button" variant="ghost">
            Cancel
          </Button>
          <Button
            disabled={isPending || (needsBank && preview.cashUsed > 0 && !bankAccountId)}
            isLoading={isPending}
            onClick={async () => {
              await onConfirm({
                paymentDate,
                bankAccountId:
                  needsBank && preview.cashUsed > 0 ? bankAccountId || undefined : undefined,
                carryForwardMaxPercent: needsPercent ? percent : undefined,
              });
            }}
            type="button"
          >
            Confirm
          </Button>
        </div>
      </div>
    </CreateEditDrawer>
  );
}

import { Checkbox } from "@/components/ui/checkbox";

export type PaymentDefaultFlags = {
  defaultForExpense: boolean;
  defaultForReceive: boolean;
  defaultForVendorPay: boolean;
};

interface PaymentDefaultCheckboxesProps {
  value: PaymentDefaultFlags;
  onChange: (value: PaymentDefaultFlags) => void;
  disabled?: boolean;
}

export function PaymentDefaultCheckboxes({ value, onChange, disabled }: PaymentDefaultCheckboxesProps) {
  return (
    <div className="space-y-2 text-sm">
      <p className="font-medium">Payment defaults</p>
      <label className="flex items-center gap-2">
        <Checkbox
          checked={value.defaultForExpense}
          disabled={disabled}
          onChange={(event) => onChange({ ...value, defaultForExpense: event.target.checked })}
        />
        Make default for expense payments
      </label>
      <label className="flex items-center gap-2">
        <Checkbox
          checked={value.defaultForReceive}
          disabled={disabled}
          onChange={(event) => onChange({ ...value, defaultForReceive: event.target.checked })}
        />
        Make default for invoice / customer receive
      </label>
      <label className="flex items-center gap-2">
        <Checkbox
          checked={value.defaultForVendorPay}
          disabled={disabled}
          onChange={(event) => onChange({ ...value, defaultForVendorPay: event.target.checked })}
        />
        Make default for bill / vendor payments
      </label>
    </div>
  );
}

import { Select } from "@/components/ui/select";
import { FormField } from "@/components/shared/form-field";
import type { Account } from "@/features/accounts/types/account.types";

interface AccountSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Account[];
  placeholder?: string;
  error?: string;
}

export function AccountSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Select account",
  error,
}: AccountSelectProps) {
  return (
    <FormField error={error} label={label}>
      <Select onChange={(event) => onChange(event.target.value)} value={value}>
        <option value="">{placeholder}</option>
        {options.map((account) => (
          <option key={account.id} value={account.id}>
            {(account.code ? `${account.code} - ` : "") + account.name}
          </option>
        ))}
      </Select>
    </FormField>
  );
}

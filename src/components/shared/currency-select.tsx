import { Select } from "@/components/ui/select";
import { useCurrencies } from "@/features/currencies/hooks/use-currencies";

interface CurrencySelectProps {
  value?: string | null;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
  name?: string;
  id?: string;
}

export function CurrencySelect({
  value,
  onChange,
  onBlur,
  disabled,
  className,
  name,
  id,
}: CurrencySelectProps) {
  const currenciesQuery = useCurrencies();
  const currencies = currenciesQuery.data ?? [];
  const current = value ?? "";

  const hasCurrent = !current || currencies.some((currency) => currency.code === current);

  return (
    <Select
      className={className}
      disabled={disabled || currenciesQuery.isLoading}
      id={id}
      name={name}
      onBlur={onBlur}
      onChange={(event) => onChange(event.target.value)}
      value={current}
    >
      <option value="">
        {currenciesQuery.isLoading ? "Loading currencies..." : "Select currency"}
      </option>
      {!hasCurrent && current ? <option value={current}>{current}</option> : null}
      {currencies.map((currency) => (
        <option key={currency.code} value={currency.code}>
          {currency.code} - {currency.name}
        </option>
      ))}
    </Select>
  );
}

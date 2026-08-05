import { Select } from "@/components/ui/select";
import { FormField } from "@/components/shared/form-field";

const CREATE_SENTINEL = "__create__";

interface CounterpartyOption {
  id: string;
  label: string;
  secondary?: string;
}

interface CounterpartySelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: CounterpartyOption[];
  error?: string;
  placeholder: string;
  onCreateNew?: () => void;
  createLabel?: string;
}

export function CounterpartySelect({
  label,
  value,
  onChange,
  options,
  error,
  placeholder,
  onCreateNew,
  createLabel = "Create new…",
}: CounterpartySelectProps) {
  return (
    <FormField error={error} label={label}>
      <Select
        onChange={(event) => {
          const next = event.target.value;
          if (next === CREATE_SENTINEL) {
            onCreateNew?.();
            return;
          }
          onChange(next);
        }}
        value={value}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.secondary
              ? `${option.label} (${option.secondary})`
              : option.label}
          </option>
        ))}
        {onCreateNew ? <option value={CREATE_SENTINEL}>{createLabel}</option> : null}
      </Select>
    </FormField>
  );
}

import { Select } from "@/components/ui/select";
import { FormField } from "@/components/shared/form-field";

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
}

export function CounterpartySelect({
  label,
  value,
  onChange,
  options,
  error,
  placeholder,
}: CounterpartySelectProps) {
  return (
    <FormField error={error} label={label}>
      <Select onChange={(event) => onChange(event.target.value)} value={value}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.secondary
              ? `${option.label} (${option.secondary})`
              : option.label}
          </option>
        ))}
      </Select>
    </FormField>
  );
}

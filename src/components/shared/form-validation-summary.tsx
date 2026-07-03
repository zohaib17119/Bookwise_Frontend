import type { FieldErrors } from "react-hook-form";

function flattenFieldErrors(errors: FieldErrors, prefix = ""): string[] {
  const messages: string[] = [];

  for (const [key, value] of Object.entries(errors)) {
    if (!value) continue;

    const path = prefix ? `${prefix}.${key}` : key;

    if (
      typeof value === "object" &&
      value !== null &&
      "message" in value &&
      typeof value.message === "string"
    ) {
      const label = prefix ? `${path}: ` : "";
      messages.push(`${label}${value.message}`);
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item && typeof item === "object") {
          messages.push(...flattenFieldErrors(item as FieldErrors, `Line ${index + 1}`));
        }
      });
      continue;
    }

    if (typeof value === "object" && value !== null) {
      messages.push(...flattenFieldErrors(value as FieldErrors, path));
    }
  }

  return messages;
}

interface FormValidationSummaryProps {
  errors: FieldErrors;
  submitCount: number;
}

export function FormValidationSummary({ errors, submitCount }: FormValidationSummaryProps) {
  if (submitCount === 0) {
    return null;
  }

  const messages = flattenFieldErrors(errors);
  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-destructive">
      <p className="text-sm font-medium">Please fix the following before submitting</p>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-sm opacity-90">
        {messages.map((message, index) => (
          <li key={`${index}-${message}`}>{message}</li>
        ))}
      </ul>
    </div>
  );
}

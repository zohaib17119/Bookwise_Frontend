const DECIMAL_PATTERN = /^\d+(\.\d{1,4})?$/;

export function toDecimalString(value: unknown, decimals = 4): string {
  if (value === "" || value === null || value === undefined) {
    return "";
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return "";
    }

    return value.toFixed(decimals);
  }

  const trimmed = String(value).trim();
  if (!trimmed) {
    return "";
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return trimmed;
  }

  return parsed.toFixed(decimals);
}

export function toOptionalDecimalString(value: unknown, decimals = 4): string {
  if (value === "" || value === null || value === undefined) {
    return "";
  }

  return toDecimalString(value, decimals);
}

export function isValidDecimalString(value: string): boolean {
  return value === "" || DECIMAL_PATTERN.test(value);
}

export const DECIMAL_STRING_REGEX = DECIMAL_PATTERN;

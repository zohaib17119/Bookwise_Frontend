const DECIMAL_PATTERN = /^\d+(\.\d{1,4})?$/;
const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;

export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Normalize a decimal for forms. Default 4dp for qty/rates;
 * pass decimals=2 for currency amounts.
 */
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

/** Currency-oriented helper — always two decimal places when non-empty. */
export function toMoneyDecimalString(value: unknown): string {
  if (value === "" || value === null || value === undefined) {
    return "";
  }
  return toDecimalString(value, 2);
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

export function isValidMoneyString(value: string): boolean {
  return value === "" || MONEY_PATTERN.test(value);
}

export const DECIMAL_STRING_REGEX = DECIMAL_PATTERN;
export const MONEY_STRING_REGEX = MONEY_PATTERN;

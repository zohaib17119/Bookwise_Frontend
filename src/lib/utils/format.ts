export function formatCurrency(
  value: number,
  currency = "USD",
  locale = "en-US",
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number, locale = "en-US") {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatTrendDate(value: string, locale = "en-US") {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDate(value?: string | null, locale = "en-US") {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

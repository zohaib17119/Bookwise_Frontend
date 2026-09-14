export function formatCurrency(
  value: number | string | null | undefined,
  currency = "USD",
  locale = "en-US",
) {
  const numericValue =
    typeof value === "number"
      ? value
      : value === null || value === undefined || value === ""
        ? 0
        : Number(value);

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
}

/** Format a money amount as a plain 2-decimal string (no currency symbol). */
export function formatMoneyAmount(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "0.00";
  }

  const raw = typeof value === "string" ? value.trim().replace(/,/g, "") : value;
  if (raw === "") {
    return "0.00";
  }

  const parsed = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(parsed)) {
    return "0.00";
  }

  return parsed.toFixed(2);
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

export function formatDateTime(value?: string | null, locale = "en-US") {
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
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatShortDateRange(fromDate: string, toDate: string, locale = "en-US") {
  const formatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const from = new Date(fromDate);
  const to = new Date(toDate);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return `${fromDate} – ${toDate}`;
  }

  return `${formatter.format(from)} – ${formatter.format(to)}`;
}

export function formatPercent(value: number, locale = "en-US") {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatPercentChange(value: number | null): string {
  if (value === null) {
    return "New activity this period";
  }

  if (value === 0) {
    return "No change from last period";
  }

  const direction = value > 0 ? "↑" : "↓";
  return `${direction} ${formatPercent(Math.abs(value))}% from last period`;
}

/**
 * Parse a money value for UI comparison / allocation helpers.
 * Prefer keeping API money as strings at rest; use this only at the edge.
 */
export function parseMoney(value: unknown): number {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  if (typeof value === "string") {
    const trimmed = value.trim().replace(/,/g, "");
    if (!trimmed) {
      return 0;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Keep money as a 2-decimal string for forms and payloads. */
export function toMoneyString(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "0.00";
  }

  if (typeof value === "string") {
    const trimmed = value.trim().replace(/,/g, "");
    if (!trimmed) {
      return "0.00";
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed.toFixed(2) : "0.00";
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : "0.00";
}

/** Half-cent tolerance for 2dp money comparisons in the UI. */
export const MONEY_EPSILON = 0.005;

export function clampAllocationAmount(amount: number, maxAmount: number): number {
  if (!Number.isFinite(amount) || amount < 0) {
    return 0;
  }

  const clamped = Math.min(amount, Math.max(maxAmount, 0));
  return Number(clamped.toFixed(2));
}

const ALLOCATABLE_INVOICE_STATUSES = new Set(["ISSUED", "PARTIALLY_PAID", "OVERDUE"]);
const ALLOCATABLE_BILL_STATUSES = new Set(["OPEN", "PARTIALLY_PAID", "OVERDUE"]);

export function isAllocatableInvoiceStatus(status?: string | null, rawStatus?: string | null) {
  const effectiveStatus = rawStatus ?? status;
  return effectiveStatus ? ALLOCATABLE_INVOICE_STATUSES.has(effectiveStatus) : false;
}

export function isAllocatableBillStatus(status?: string | null, rawStatus?: string | null) {
  const effectiveStatus = rawStatus ?? status;
  return effectiveStatus ? ALLOCATABLE_BILL_STATUSES.has(effectiveStatus) : false;
}

export function validateAllocations(input: {
  paymentAmount: number | string;
  allocations: Record<string, number | string>;
  documents: Array<{ id: string; number: string; amountDue: number | string }>;
}) {
  const errors: string[] = [];
  const paymentAmount = parseMoney(input.paymentAmount);
  let allocatedTotal = 0;

  for (const document of input.documents) {
    const allocatedAmount = parseMoney(input.allocations[document.id] ?? 0);
    if (allocatedAmount <= 0) {
      continue;
    }

    allocatedTotal += allocatedAmount;
    const amountDue = parseMoney(document.amountDue);

    if (allocatedAmount > amountDue + MONEY_EPSILON) {
      errors.push(
        `Allocation for ${document.number} (${toMoneyString(allocatedAmount)}) exceeds remaining due (${toMoneyString(amountDue)}).`,
      );
    }
  }

  if (allocatedTotal > paymentAmount + MONEY_EPSILON) {
    errors.push(
      `Total allocated amount (${toMoneyString(allocatedTotal)}) exceeds payment amount (${toMoneyString(paymentAmount)}).`,
    );
  }

  return errors;
}

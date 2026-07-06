export function parseMoney(value: unknown): number {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function clampAllocationAmount(amount: number, maxAmount: number): number {
  if (!Number.isFinite(amount) || amount < 0) {
    return 0;
  }

  return Math.min(amount, Math.max(maxAmount, 0));
}

const ALLOCATABLE_INVOICE_STATUSES = new Set(["ISSUED", "PARTIALLY_PAID", "OVERDUE"]);
const ALLOCATABLE_BILL_STATUSES = new Set(["ISSUED", "PARTIALLY_PAID", "OVERDUE"]);

export function isAllocatableInvoiceStatus(status?: string | null, rawStatus?: string | null) {
  const effectiveStatus = rawStatus ?? status;
  return effectiveStatus ? ALLOCATABLE_INVOICE_STATUSES.has(effectiveStatus) : false;
}

export function isAllocatableBillStatus(status?: string | null, rawStatus?: string | null) {
  const effectiveStatus = rawStatus ?? status;
  return effectiveStatus ? ALLOCATABLE_BILL_STATUSES.has(effectiveStatus) : false;
}

export function validateAllocations(input: {
  paymentAmount: number;
  allocations: Record<string, number>;
  documents: Array<{ id: string; number: string; amountDue: number }>;
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

    if (allocatedAmount > document.amountDue + 0.0001) {
      errors.push(
        `Allocation for ${document.number} (${allocatedAmount.toFixed(2)}) exceeds remaining due (${document.amountDue.toFixed(2)}).`,
      );
    }
  }

  if (allocatedTotal > paymentAmount + 0.0001) {
    errors.push(
      `Total allocated amount (${allocatedTotal.toFixed(2)}) exceeds payment amount (${paymentAmount.toFixed(2)}).`,
    );
  }

  return errors;
}

import type {
  DiscountType,
  DocumentLineInput,
} from "@/features/shared/types/documents";
import { toNumber } from "@/features/shared/utils/decimal-string";

export function getDiscountAmount(
  baseAmount: number,
  discountType?: DiscountType | null,
  discountValue?: string | number | null,
) {
  const numericDiscountValue = toNumber(discountValue);

  if (!discountType || !numericDiscountValue) {
    return 0;
  }

  if (discountType === "PERCENTAGE") {
    return (baseAmount * numericDiscountValue) / 100;
  }

  return numericDiscountValue;
}

export function getLineUnitAmount(line: DocumentLineInput) {
  return toNumber(line.unitPrice ?? line.unitCost);
}

export function getLineBaseAmount(line: DocumentLineInput) {
  return toNumber(line.quantity) * getLineUnitAmount(line);
}

/** Exclusive → inclusive using tax percent. 0 / missing rate returns excl unchanged. */
export function exclToIncl(excl: number, ratePercent: number) {
  if (!Number.isFinite(excl) || excl < 0) return 0;
  if (!Number.isFinite(ratePercent) || ratePercent <= 0) return excl;
  return excl * (1 + ratePercent / 100);
}

/** Inclusive → exclusive using tax percent. 0 / missing rate returns incl unchanged. */
export function inclToExcl(incl: number, ratePercent: number) {
  if (!Number.isFinite(incl) || incl < 0) return 0;
  if (!Number.isFinite(ratePercent) || ratePercent <= 0) return incl;
  return incl / (1 + ratePercent / 100);
}

export function getLineDiscountedAmount(line: DocumentLineInput) {
  const baseAmount = getLineBaseAmount(line);
  const discount = getDiscountAmount(
    baseAmount,
    line.discountType,
    line.discountValue,
  );
  return Math.max(baseAmount - discount, 0);
}

/**
 * Given an inclusive line amount (after discount + tax), solve for unit cost/price
 * so that getLinePreviewTotal matches (exclusive tax-on-top model).
 */
export function unitAmountFromInclusiveLineTotal(
  line: DocumentLineInput,
  inclusiveAmount: number,
): number {
  const qty = toNumber(line.quantity);
  if (qty <= 0) return 0;

  const rate = toNumber(line.taxRate);
  let discounted = inclToExcl(Math.max(inclusiveAmount, 0), rate);

  const discountType = line.discountType;
  const discountValue = toNumber(line.discountValue);
  let base = discounted;

  if (discountType === "PERCENTAGE" && discountValue > 0 && discountValue < 100) {
    base = discounted / (1 - discountValue / 100);
  } else if (discountType === "FIXED" && discountValue > 0) {
    base = discounted + discountValue;
  }

  return Math.max(base / qty, 0);
}

export function getLinePreviewTotal(line: DocumentLineInput) {
  const discountedAmount = getLineDiscountedAmount(line);
  const taxRate = toNumber(line.taxRate);
  const tax = taxRate > 0 ? (discountedAmount * taxRate) / 100 : 0;
  return Math.max(discountedAmount + tax, 0);
}

export interface GetDocumentPreviewTotalsOptions {
  discountType?: DiscountType | null;
  discountValue?: string | number | null;
}

export function getDocumentPreviewTotals(
  lines: DocumentLineInput[],
  options?: GetDocumentPreviewTotalsOptions,
) {
  const linesSubtotal = lines.reduce(
    (sum, line) => sum + getLineBaseAmount(line),
    0,
  );

  const lineDiscountsTotal = lines.reduce((sum, line) => {
    const baseAmount = getLineBaseAmount(line);
    return (
      sum +
      getDiscountAmount(baseAmount, line.discountType, line.discountValue)
    );
  }, 0);

  const afterLineDiscounts = Math.max(linesSubtotal - lineDiscountsTotal, 0);

  const docDiscount = getDiscountAmount(
    afterLineDiscounts,
    options?.discountType,
    options?.discountValue,
  );

  const subtotal = Math.max(afterLineDiscounts - docDiscount, 0);

  const taxTotal = lines.reduce((sum, line) => {
    const baseAmount = getLineBaseAmount(line);
    const lineDiscount = getDiscountAmount(
      baseAmount,
      line.discountType,
      line.discountValue,
    );
    const discountedAmount = Math.max(baseAmount - lineDiscount, 0);

    const docDiscountShare =
      afterLineDiscounts > 0
        ? (discountedAmount / afterLineDiscounts) * docDiscount
        : 0;
    const taxableAmount = Math.max(discountedAmount - docDiscountShare, 0);

    const taxRate = toNumber(line.taxRate);
    return sum + (taxRate > 0 ? (taxableAmount * taxRate) / 100 : 0);
  }, 0);

  return {
    subtotal,
    discountTotal: lineDiscountsTotal + docDiscount,
    taxTotal,
    total: Math.max(subtotal + taxTotal, 0),
  };
}

export function getAllocatedTotal(allocations: { allocatedAmount: number | string }[]) {
  return allocations.reduce(
    (sum, allocation) => sum + toNumber(allocation.allocatedAmount),
    0,
  );
}

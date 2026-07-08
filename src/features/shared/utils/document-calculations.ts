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

export function getLinePreviewTotal(line: DocumentLineInput) {
  const baseAmount = getLineBaseAmount(line);
  const discount = getDiscountAmount(
    baseAmount,
    line.discountType,
    line.discountValue,
  );
  const discountedAmount = Math.max(baseAmount - discount, 0);

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

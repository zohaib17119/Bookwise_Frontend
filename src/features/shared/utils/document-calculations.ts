import type {
  DiscountType,
  DocumentLineInput,
} from "@/features/shared/types/documents";

export function getDiscountAmount(
  baseAmount: number,
  discountType?: DiscountType | null,
  discountValue?: number | null,
) {
  if (!discountType || !discountValue) {
    return 0;
  }

  if (discountType === "percentage") {
    return (baseAmount * discountValue) / 100;
  }

  return discountValue;
}

export function getLineUnitAmount(line: DocumentLineInput) {
  return line.unitPrice ?? line.unitCost ?? 0;
}

export function getLineBaseAmount(line: DocumentLineInput) {
  return Number(line.quantity || 0) * Number(getLineUnitAmount(line) || 0);
}

export function getLinePreviewTotal(line: DocumentLineInput) {
  const baseAmount = getLineBaseAmount(line);
  const discount = getDiscountAmount(
    baseAmount,
    line.discountType,
    line.discountValue,
  );
  const discountedAmount = Math.max(baseAmount - discount, 0);

  const taxRate = line.taxRate ?? 0;
  const tax = taxRate > 0 ? (discountedAmount * taxRate) / 100 : 0;

  return Math.max(discountedAmount + tax, 0);
}

export interface GetDocumentPreviewTotalsOptions {
  discountType?: DiscountType | null;
  discountValue?: number | null;
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

    const taxRate = line.taxRate ?? 0;
    return sum + (taxRate > 0 ? (taxableAmount * taxRate) / 100 : 0);
  }, 0);

  return {
    subtotal,
    discountTotal: lineDiscountsTotal + docDiscount,
    taxTotal,
    total: Math.max(subtotal + taxTotal, 0),
  };
}

export function getAllocatedTotal(allocations: { allocatedAmount: number }[]) {
  return allocations.reduce(
    (sum, allocation) => sum + Number(allocation.allocatedAmount || 0),
    0,
  );
}

import type { DiscountType, DocumentLineInput } from "@/features/shared/types/documents";
import { toDecimalString, toOptionalDecimalString } from "@/features/shared/utils/decimal-string";

/** Omit keys whose value is null, undefined, or "" — for Zod .optional() fields */
export function omitEmptyFields<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== null && value !== undefined && value !== ""),
  ) as Partial<T>;
}

export function serializeMoneyField(value: unknown): string {
  return toDecimalString(value);
}

export function serializeOptionalMoneyField(value: unknown): string | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  return toOptionalDecimalString(value);
}

export function serializeDocumentLineMoney<T extends Record<string, unknown>>(line: T): Partial<T> {
  return omitEmptyFields({
    ...line,
    quantity:
      line.quantity !== null && line.quantity !== undefined && line.quantity !== ""
        ? toDecimalString(line.quantity)
        : undefined,
    unitPrice:
      line.unitPrice !== null && line.unitPrice !== undefined && line.unitPrice !== ""
        ? toDecimalString(line.unitPrice)
        : undefined,
    unitCost:
      line.unitCost !== null && line.unitCost !== undefined && line.unitCost !== ""
        ? toDecimalString(line.unitCost)
        : undefined,
    discountValue: line.discountValue ? toOptionalDecimalString(line.discountValue) : undefined,
    taxRate: line.taxRate ? toOptionalDecimalString(line.taxRate) : undefined,
  }) as Partial<T>;
}

type FormLinePreviewInput = {
  itemId?: string | null;
  description?: string;
  quantity?: unknown;
  unitPrice?: unknown;
  unitCost?: unknown;
  discountType?: DiscountType | null;
  discountValue?: unknown;
  taxCodeId?: string | null;
  taxRate?: unknown;
  expenseAccountId?: string | null;
};

export function toDocumentLinePreview(line: FormLinePreviewInput): DocumentLineInput {
  return {
    itemId: line.itemId || undefined,
    description: line.description ?? "",
    quantity: toDecimalString(line.quantity),
    unitPrice:
      line.unitPrice !== null && line.unitPrice !== undefined && line.unitPrice !== ""
        ? toOptionalDecimalString(line.unitPrice)
        : undefined,
    unitCost:
      line.unitCost !== null && line.unitCost !== undefined && line.unitCost !== ""
        ? toOptionalDecimalString(line.unitCost)
        : undefined,
    discountType: line.discountType ?? undefined,
    discountValue:
      line.discountValue !== null && line.discountValue !== undefined && line.discountValue !== ""
        ? toOptionalDecimalString(line.discountValue)
        : undefined,
    taxCodeId: line.taxCodeId || undefined,
    taxRate:
      line.taxRate !== null && line.taxRate !== undefined && line.taxRate !== ""
        ? toOptionalDecimalString(line.taxRate)
        : undefined,
    expenseAccountId: line.expenseAccountId || undefined,
  };
}

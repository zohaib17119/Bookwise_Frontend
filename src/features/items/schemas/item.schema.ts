import { z } from "zod";

const optionalString = z.string().optional().or(z.literal(""));
const optionalDecimalString = z.string().optional().or(z.literal(""));

export const itemSchema = z.object({
  itemCode: optionalString,
  name: z.string().min(2, "Item name is required").max(120),
  description: optionalString,
  type: z.enum(["inventory", "non_inventory", "service"]),
  sku: optionalString,
  barcode: optionalString,
  unitName: optionalString,
  hsCode: z.string().min(1, "HS code is required"),
  salesPrice: optionalDecimalString,
  purchaseCost: optionalDecimalString,
  incomeAccountId: optionalString,
  expenseAccountId: optionalString,
  assetAccountId: optionalString,
  preferredVendorId: optionalString,
  taxable: z.boolean(),
  taxRateId: z.string().min(1, "Tax rate is required"),
  trackQuantity: z.boolean(),
  quantityOnHand: optionalDecimalString,
  reorderLevel: optionalDecimalString,
  isActive: z.boolean(),
});

export type ItemFormInput = z.input<typeof itemSchema>;
export type ItemFormValues = z.output<typeof itemSchema>;

import { z } from "zod";

const optionalString = z.string().optional().or(z.literal(""));
const optionalDecimalString = z.string().optional().or(z.literal(""));

export const itemSchema = z.object({
  itemCode: optionalString,
  name: z.string().min(2, "Item name is required").max(120),
  description: optionalString,
  type: z.enum(["inventory", "non_inventory", "service"]),
  sku: optionalString,
  unitName: optionalString,
  salesPrice: optionalDecimalString,
  purchaseCost: optionalDecimalString,
  incomeAccountId: optionalString,
  expenseAccountId: optionalString,
  assetAccountId: optionalString,
  preferredVendorId: optionalString,
  taxable: z.boolean(),
  taxCode: optionalString,
  trackQuantity: z.boolean(),
  quantityOnHand: optionalDecimalString,
  reorderLevel: optionalDecimalString,
  isActive: z.boolean(),
});

export type ItemFormInput = z.input<typeof itemSchema>;
export type ItemFormValues = z.output<typeof itemSchema>;

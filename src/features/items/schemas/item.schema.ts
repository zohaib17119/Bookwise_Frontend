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
  hsCodeCategoryId: optionalString,
  fbrUom: optionalString,
  fbrSaleType: optionalString,
  fbrSroScheduleNo: optionalString,
  fbrSroItemSerialNo: optionalString,
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

export function buildItemSchema(requireFbrDi: boolean, requireSro = false) {
  if (!requireFbrDi) return itemSchema;
  const base = itemSchema.extend({
    hsCodeCategoryId: z.string().min(1, "HS code is required for FBR Digital Invoicing"),
    fbrUom: z.string().trim().min(1, "FBR UoM is required"),
    fbrSaleType: z.string().trim().min(1, "FBR sale type is required"),
  });
  if (!requireSro) return base;
  return base.extend({
    fbrSroScheduleNo: z.string().trim().min(1, "SRO schedule is required for this sale type / scenario"),
    fbrSroItemSerialNo: z.string().trim().min(1, "SRO item serial is required for this sale type / scenario"),
  });
}

export type ItemFormInput = z.input<typeof itemSchema>;
export type ItemFormValues = z.output<typeof itemSchema>;

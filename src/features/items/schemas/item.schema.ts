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
  itemCategoryId: optionalString,
  hsCodeCategoryId: optionalString,
  fbrUom: optionalString,
  fbrSaleType: optionalString,
  fbrSroScheduleNo: optionalString,
  fbrSroItemSerialNo: optionalString,
  fbrFixedNotifiedValueOrRetailPrice: optionalDecimalString,
  fbrQtyPerSellingUnit: optionalDecimalString,
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

export function buildItemSchema(
  requireFbrDi: boolean,
  requireSro = false,
  requireFixedNotifiedRetail = false,
  requireQtyFactor = false,
) {
  if (!requireFbrDi) return itemSchema;
  const withDi = itemSchema.extend({
    hsCodeCategoryId: z.string().min(1, "HS code is required for FBR Digital Invoicing"),
    fbrUom: z.string().trim().min(1, "FBR UoM is required"),
    fbrSaleType: z.string().trim().min(1, "FBR sale type is required"),
  });
  const withSro = requireSro
    ? withDi.extend({
        fbrSroScheduleNo: z
          .string()
          .trim()
          .min(1, "SRO schedule is required for this sale type / scenario"),
        fbrSroItemSerialNo: z
          .string()
          .trim()
          .min(1, "SRO item serial is required for this sale type / scenario"),
      })
    : withDi;
  const withRetail = requireFixedNotifiedRetail
    ? withSro.extend({
        fbrFixedNotifiedValueOrRetailPrice: z
          .string()
          .trim()
          .min(1, "Fixed / notified / retail price is required for 3rd Schedule Goods")
          .refine((v) => {
            const n = Number(v);
            return Number.isFinite(n) && n > 0;
          }, "Must be greater than 0 (FBR 0300)"),
      })
    : withSro;
  if (!requireQtyFactor) return withRetail;
  return withRetail.extend({
    fbrQtyPerSellingUnit: z
      .string()
      .trim()
      .min(1, "FBR quantity per selling unit is required when UoM differs")
      .refine((v) => {
        const n = Number(v);
        return Number.isFinite(n) && n > 0;
      }, "Must be greater than 0 (e.g. 0.20 KG per piece)"),
  });
}

export type ItemFormInput = z.input<typeof itemSchema>;
export type ItemFormValues = z.output<typeof itemSchema>;

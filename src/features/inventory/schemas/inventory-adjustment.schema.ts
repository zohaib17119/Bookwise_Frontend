import { z } from "zod";

const optionalString = z.string().optional().or(z.literal(""));
const optionalMoney = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return 0;
  }
  return Number(value);
}, z.number().min(0));

export const inventoryAdjustmentLineSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  quantity: z.coerce.number().min(0.01),
  direction: z.enum(["IN", "OUT"]),
  unitCost: optionalMoney,
  notes: optionalString,
});

export const inventoryAdjustmentSchema = z.object({
  adjustmentDate: optionalString,
  reason: optionalString,
  notes: optionalString,
  lines: z.array(inventoryAdjustmentLineSchema).min(1, "At least one line is required"),
});

export type InventoryAdjustmentFormInput = z.input<typeof inventoryAdjustmentSchema>;
export type InventoryAdjustmentFormValues = z.output<typeof inventoryAdjustmentSchema>;

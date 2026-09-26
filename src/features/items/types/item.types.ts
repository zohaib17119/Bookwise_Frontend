import type { BaseEntityListParams } from "@/features/shared/types/common";

export type ItemType = "inventory" | "non_inventory" | "service";

export interface Item {
  id: string;
  itemCode?: string | null;
  name: string;
  description?: string | null;
  type: ItemType;
  sku?: string | null;
  barcode?: string | null;
  unitName?: string | null;
  hsCode?: string | null;
  hsCodeCategoryId?: string | null;
  fbrUom?: string | null;
  fbrSaleType?: string | null;
  fbrSroScheduleNo?: string | null;
  fbrSroItemSerialNo?: string | null;
  fbrFixedNotifiedValueOrRetailPrice?: string | null;
  fbrQtyPerSellingUnit?: string | null;
  salesPrice?: string | null;
  purchaseCost?: string | null;
  incomeAccountId?: string | null;
  expenseAccountId?: string | null;
  assetAccountId?: string | null;
  preferredVendorId?: string | null;
  preferredVendorName?: string | null;
  taxable: boolean;
  taxRateId?: string | null;
  trackQuantity: boolean;
  quantityOnHand?: string | null;
  reorderLevel?: string | null;
  isActive: boolean;
}

export interface ItemListParams extends BaseEntityListParams {
  type?: string;
  taxable?: boolean;
  trackQuantity?: boolean;
  preferredVendorId?: string;
}

export interface ItemPayload {
  itemCode?: string;
  name: string;
  description?: string;
  type: ItemType;
  sku?: string;
  barcode?: string | null;
  unitName?: string;
  hsCode?: string | null;
  hsCodeCategoryId?: string | null;
  fbrUom?: string | null;
  fbrSaleType?: string | null;
  fbrSroScheduleNo?: string | null;
  fbrSroItemSerialNo?: string | null;
  fbrFixedNotifiedValueOrRetailPrice?: string | null;
  fbrQtyPerSellingUnit?: string | null;
  salesPrice?: string | null;
  purchaseCost?: string | null;
  incomeAccountId?: string | null;
  expenseAccountId?: string | null;
  assetAccountId?: string | null;
  preferredVendorId?: string | null;
  taxable: boolean;
  taxRateId: string;
  trackQuantity: boolean;
  quantityOnHand?: string | null;
  reorderLevel?: string | null;
  isActive: boolean;
}

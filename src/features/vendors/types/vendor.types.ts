import type { BaseEntityListParams } from "@/features/shared/types/common";

export interface Vendor {
  id: string;
  vendorCode?: string | null;
  displayName: string;
  legalName?: string | null;
  contactPersonName?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  website?: string | null;
  taxRegistrationNumber?: string | null;
  currencyCode?: string | null;
  paymentTermsDays?: number | null;
  openingBalance?: number | null;
  openingBalanceDate?: string | null;
  billingAddressLine1?: string | null;
  billingAddressLine2?: string | null;
  billingCity?: string | null;
  billingState?: string | null;
  billingPostalCode?: string | null;
  billingCountry?: string | null;
  notes?: string | null;
  isActive: boolean;
}

export interface VendorListParams extends BaseEntityListParams {}

export interface VendorPayload {
  vendorCode?: string;
  displayName: string;
  legalName?: string;
  contactPersonName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  taxRegistrationNumber?: string;
  currencyCode?: string;
  paymentTermsDays?: number | null;
  openingBalance?: string;
  openingBalanceDate?: string;
  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;
  notes?: string;
  isActive: boolean;
}

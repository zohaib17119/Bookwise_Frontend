import type { BaseEntityListParams } from "@/features/shared/types/common";

export interface Customer {
  id: string;
  customerCode?: string | null;
  displayName: string;
  legalName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  website?: string | null;
  taxRegistrationNumber?: string | null;
  currencyCode?: string | null;
  hasTransactions?: boolean;
  paymentTermsDays?: number | null;
  openingBalance?: number | null;
  openBalance?: string | null;
  openingBalanceDate?: string | null;
  billingAddressLine1?: string | null;
  billingAddressLine2?: string | null;
  billingCity?: string | null;
  billingState?: string | null;
  billingPostalCode?: string | null;
  billingCountry?: string | null;
  shippingAddressLine1?: string | null;
  shippingAddressLine2?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingPostalCode?: string | null;
  shippingCountry?: string | null;
  notes?: string | null;
  isActive: boolean;
}

export interface CustomerListParams extends BaseEntityListParams {}

export interface CustomerPayload {
  customerCode?: string;
  displayName: string;
  legalName?: string;
  firstName?: string;
  lastName?: string;
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
  shippingAddressLine1?: string;
  shippingAddressLine2?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  notes?: string;
  isActive: boolean;
}

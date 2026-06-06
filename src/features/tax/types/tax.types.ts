export interface TaxRate {
  id: string;
  name: string;
  code?: string | null;
  ratePercent: number;
  scope?: string | null;
  isCompound?: boolean;
  isRecoverable?: boolean;
  isActive: boolean;
}

export interface TaxRatePayload {
  name: string;
  code?: string;
  ratePercent: number;
  scope?: string;
  isCompound?: boolean;
  isRecoverable?: boolean;
  isActive: boolean;
}

export interface TaxCodeRate {
  id: string;
  taxRateId: string;
  sortOrder: number;
  taxRate: TaxRate;
}

export interface TaxCode {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  calculationMode?: string | null;
  scope?: string | null;
  isDefaultSales?: boolean;
  isDefaultPurchase?: boolean;
  isExempt?: boolean;
  taxRateIds?: string[];
  rates?: TaxCodeRate[];
}

export interface TaxCodePayload {
  name: string;
  code?: string;
  description?: string;
  calculationMode?: string;
  scope?: string;
  isDefaultSales?: boolean;
  isDefaultPurchase?: boolean;
  isExempt?: boolean;
  taxRateIds?: string[];
}

export interface TaxSettings {
  salesTaxPayableAccountId?: string | null;
  purchaseTaxRecoverableAccountId?: string | null;
  [key: string]: unknown;
}

export interface TaxSettingsPayload {
  salesTaxPayableAccountId?: string | null;
  purchaseTaxRecoverableAccountId?: string | null;
  [key: string]: unknown;
}

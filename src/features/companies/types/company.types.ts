export interface Company {
  id: string;
  name: string;
  legalName?: string | null;
  slug?: string | null;
  currency?: string | null;
  baseCurrencyCode?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  postalCode?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  timezone?: string | null;
  fiscalYearStartMonth?: number | null;
  fiscalYearStartDay?: number | null;
  taxRegistrationNumber?: string | null;
  taxLabel?: string | null;
  companyType?: string | null;
  industry?: string | null;
  logoUrl?: string | null;
  status?: string | null;
  createdAt?: string;
  updatedAt?: string;
  setup?: {
    coaTemplate: string;
    accountsCreated: number;
    defaultMappingConfigured: boolean;
  };
}

export interface CreateCompanyPayload {
  name: string;
  coaTemplate?: "SERVICE" | "RETAIL_OR_PRODUCT" | "BOTH";
  ownerUserId?: string;
  legalName?: string;
  currency?: string;
  currencyCode?: string;
  country?: string;
  state?: string;
  city?: string;
  postalCode?: string;
  addressLine1?: string;
  addressLine2?: string;
  email?: string;
  phone?: string;
  website?: string;
  timezone?: string;
  fiscalYearStartMonth?: number;
  fiscalYearStartDay?: number;
  taxRegistrationNumber?: string;
  taxLabel?: string;
  companyType?: string;
  industry?: string;
  logoUrl?: string;
  status?: string;
  baseCurrencyCode?: string;
}

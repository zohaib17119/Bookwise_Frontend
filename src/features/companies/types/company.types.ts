export interface Company {
  id: string;
  name: string;
  legalName?: string | null;
  slug?: string | null;
  currency?: string | null;
  currencyCode?: string | null;
  baseCurrencyCode?: string | null;
  country?: string | null;
  countryCode?: string | null;
  complianceModule?: "ZATCA" | "FBR" | null;
  zatcaConfig?: { isEnabled?: boolean } | null;
  fbrConfig?: {
    isEnabled?: boolean;
    environment?: "SANDBOX" | "PRODUCTION";
    integrationStatus?: "DISABLED" | "SETUP" | "ENABLED" | "ERROR";
    fbrBusinessActivity?: string | null;
    fbrBusinessSector?: string | null;
    defaultSaleType?: string | null;
    defaultScenarioId?: string | null;
  } | null;
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
  accessType?: "OWNER" | "MEMBER";
  role?: "OWNER" | "ADMIN" | "ACCOUNTANT" | "STAFF" | "VIEWER";
  membershipStatus?: "ACTIVE" | "INVITED" | "SUSPENDED" | "REMOVED";
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
  countryCode?: string;
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

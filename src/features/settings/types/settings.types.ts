import type { Company } from "@/features/companies/types/company.types";

export interface CompanySettings extends Company {
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  state?: string | null;
  city?: string | null;
  postalCode?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  timezone?: string | null;
  fiscalYearStartDay?: number | null;
  taxRegistrationNumber?: string | null;
  taxLabel?: string | null;
  companyType?: string | null;
  industry?: string | null;
  logoUrl?: string | null;
  status?: string | null;
  baseCurrencyCode?: string | null;
}

export interface AccountingSettings {
  fiscalYearStartMonth?: number | null;
  fiscalYearStartDay?: number | null;
  accountingMethod?: string | null;
  defaultCurrencyCode?: string | null;
  accountCodeStrategy?: string | null;
  accountHierarchyEnabled?: boolean;
  allowManualJournalEntries?: boolean;
  lockDate?: string | null;
}

export interface CompanySettingsPayload extends Partial<CompanySettings> {}

export interface AccountingSettingsPayload {
  fiscalYearStartMonth?: number | null;
  fiscalYearStartDay?: number | null;
  accountingMethod?: string | null;
  defaultCurrencyCode?: string | null;
  accountCodeStrategy?: string | null;
  accountHierarchyEnabled?: boolean;
  allowManualJournalEntries?: boolean;
  lockDate?: string | null;
}

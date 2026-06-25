import { z } from "zod";

const coaTemplateEnum = z.enum(["SERVICE", "RETAIL_OR_PRODUCT", "BOTH"], {
  required_error: "Please select a business type",
});

export const COA_TEMPLATES = coaTemplateEnum.options;
export type CoaTemplate = z.infer<typeof coaTemplateEnum>;

export const BUSINESS_TYPE_OPTIONS: {
  value: CoaTemplate;
  label: string;
  description: string;
  companyType: string;
}[] = [
  {
    value: "SERVICE",
    label: "Service-based business",
    description: "You sell time or services (no inventory).",
    companyType: "Service-based business",
  },
  {
    value: "RETAIL_OR_PRODUCT",
    label: "Sell products / retail",
    description: "You buy and sell physical goods (inventory + COGS).",
    companyType: "Product / retail business",
  },
  {
    value: "BOTH",
    label: "Both products and services",
    description: "You offer a mix of services and products.",
    companyType: "Products and services",
  },
];

const optionalText = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""));

export const createCompanySchema = z.object({
  // Step 1 - basics & business type
  name: z.string().trim().min(2, "Company name must be at least 2 characters"),
  legalName: optionalText,
  coaTemplate: coaTemplateEnum,
  currencyCode: z
    .string()
    .trim()
    .length(3, "Use a 3-letter currency code"),
  baseCurrencyCode: z
    .string()
    .trim()
    .length(3, "Use a 3-letter currency code")
    .optional()
    .or(z.literal("")),
  timezone: z.string().trim().min(2, "Timezone is required"),
  fiscalYearStartMonth: z.number().int().min(1).max(12),

  // Step 2 - address & contact
  addressLine1: z.string().trim().min(1, "Address line 1 is required"),
  addressLine2: optionalText,
  city: z.string().trim().min(1, "City is required"),
  state: optionalText,
  postalCode: optionalText,
  country: optionalText,
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().min(1, "Phone is required"),
  website: z
    .string()
    .trim()
    .url("Enter a valid URL")
    .optional()
    .or(z.literal("")),

  // Step 3 - tax & branding
  taxRegistrationNumber: optionalText,
  taxLabel: optionalText,
  logoUrl: optionalText,

  ownerUserId: z.string(),
});

export type CreateCompanyFormValues = z.infer<typeof createCompanySchema>;

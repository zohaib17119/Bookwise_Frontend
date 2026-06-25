import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Path } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useCreateCompany } from "@/features/companies/hooks/use-create-company";
import {
  BUSINESS_TYPE_OPTIONS,
  createCompanySchema,
  type CreateCompanyFormValues,
} from "@/features/companies/schemas/create-company.schema";
import { PageHeader } from "@/components/shared/page-header";
import { FormField } from "@/components/shared/form-field";
import { FieldGrid } from "@/components/shared/field-grid";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FileInput from "@/components/ui/fileInput";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { cn } from "@/lib/utils/cn";

const STEPS = [
  { id: 1, title: "Basics" },
  { id: 2, title: "Address & contact" },
  { id: 3, title: "Tax & branding" },
] as const;

const STEP_FIELDS: Record<number, Path<CreateCompanyFormValues>[]> = {
  1: ["name", "legalName", "coaTemplate", "currencyCode", "baseCurrencyCode", "timezone", "fiscalYearStartMonth"],
  2: ["addressLine1", "addressLine2", "city", "state", "postalCode", "country", "email", "phone", "website"],
  3: ["taxRegistrationNumber", "taxLabel"],
};

const cleanText = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export function CompanyCreatePage() {
  const navigate = useNavigate();
  const createCompanyMutation = useCreateCompany();
  const user = useAuthStore((state) => state.user);

  const [step, setStep] = useState(1);
  const [logo, setLogo] = useState("");

  const defaultTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    } catch {
      return "";
    }
  }, []);

  const form = useForm<CreateCompanyFormValues>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: {
      name: "",
      legalName: "",
      currencyCode: "USD",
      baseCurrencyCode: "",
      timezone: defaultTimezone,
      fiscalYearStartMonth: 1,
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      email: "",
      phone: "",
      website: "",
      taxRegistrationNumber: "",
      taxLabel: "",
      logoUrl: "",
      ownerUserId: user?.id,
    },
  });

  const selectedTemplate = form.watch("coaTemplate");
  const createdCompany = createCompanyMutation.data;

  const goNext = async () => {
    const valid = await form.trigger(STEP_FIELDS[step]);
    if (valid) setStep((current) => Math.min(current + 1, STEPS.length));
  };

  const goBack = () => setStep((current) => Math.max(current - 1, 1));

  const onSubmit = form.handleSubmit(async (values) => {
    const businessType = BUSINESS_TYPE_OPTIONS.find((option) => option.value === values.coaTemplate);

    await createCompanyMutation.mutateAsync({
      ownerUserId: values.ownerUserId,
      name: values.name.trim(),
      coaTemplate: values.coaTemplate,
      companyType: businessType?.companyType,
      legalName: cleanText(values.legalName),
      currencyCode: values.currencyCode.trim().toUpperCase(),
      baseCurrencyCode: cleanText(values.baseCurrencyCode)?.toUpperCase(),
      timezone: values.timezone.trim(),
      fiscalYearStartMonth: values.fiscalYearStartMonth,
      addressLine1: values.addressLine1.trim(),
      addressLine2: cleanText(values.addressLine2),
      city: values.city.trim(),
      state: cleanText(values.state),
      postalCode: cleanText(values.postalCode),
      country: cleanText(values.country),
      email: values.email.trim(),
      phone: values.phone.trim(),
      website: cleanText(values.website),
      taxRegistrationNumber: cleanText(values.taxRegistrationNumber),
      taxLabel: cleanText(values.taxLabel),
      logoUrl: cleanText(logo),
    });
  });

  // ---------------------------------------------------------------------------
  // Setup complete confirmation
  // ---------------------------------------------------------------------------
  if (createdCompany) {
    const accountsCreated = createdCompany.setup?.accountsCreated ?? 0;
    const mappingReady = createdCompany.setup?.defaultMappingConfigured ?? false;

    return (
      <div className="space-y-6">
        <PageHeader
          title="Setup complete"
          description={`${createdCompany.name} is ready to go.`}
        />

        <div className="surface max-w-2xl space-y-5 p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-xl text-emerald-600">
              ✓
            </span>
            <div>
              <p className="text-base font-semibold">Your company is set up</p>
              <p className="text-sm text-muted-foreground">
                We pre-configured your books so you can start invoicing right away.
              </p>
            </div>
          </div>

          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-emerald-600">✓</span>
              Chart of accounts ready ({accountsCreated} accounts)
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-600">{mappingReady ? "✓" : "•"}</span>
              {mappingReady ? "Default account mappings configured" : "Default account mappings pending"}
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-600">✓</span>
              Company profile saved{logo ? " (logo uploaded)" : ""}
            </li>
          </ul>

          <div className="flex justify-end">
            <Button onClick={() => navigate(`/app/company/${createdCompany.id}/dashboard`)} type="button">
              Continue to dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Wizard
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create company"
        description="Tell us a bit about your business so your books and invoices are ready immediately."
      />

      <div className="surface max-w-2xl p-6">
        {/* Stepper */}
        <ol className="mb-6 flex items-center gap-2">
          {STEPS.map((stepItem, index) => (
            <li key={stepItem.id} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  step >= stepItem.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                {stepItem.id}
              </span>
              <span
                className={cn(
                  "text-xs font-medium",
                  step >= stepItem.id ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {stepItem.title}
              </span>
              {index < STEPS.length - 1 ? (
                <span className="mx-1 hidden h-px flex-1 bg-border sm:block" />
              ) : null}
            </li>
          ))}
        </ol>

        <form
          className="space-y-5"
          onSubmit={(event) => {
            // Only submit on the final step; otherwise advance.
            if (step < STEPS.length) {
              event.preventDefault();
              void goNext();
              return;
            }
            void onSubmit(event);
          }}
        >
          {createCompanyMutation.error ? (
            <Alert variant="destructive" title={createCompanyMutation.error.message} />
          ) : null}

          {/* Step 1 - Basics & business type */}
          {step === 1 ? (
            <div className="space-y-5">
              <FormField label="Company name" error={form.formState.errors.name?.message}>
                <Input placeholder="Northwind Holdings" {...form.register("name")} />
              </FormField>

              <FormField label="Legal name (optional)" error={form.formState.errors.legalName?.message}>
                <Input placeholder="Northwind Holdings LLC" {...form.register("legalName")} />
              </FormField>

              <FormField label="What does your business do?" error={form.formState.errors.coaTemplate?.message}>
                <div className="grid gap-3 sm:grid-cols-3">
                  {BUSINESS_TYPE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        form.setValue("coaTemplate", option.value, { shouldValidate: true })
                      }
                      className={cn(
                        "rounded-xl border p-4 text-left transition",
                        selectedTemplate === option.value
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-border bg-white hover:border-primary/50",
                      )}
                    >
                      <p className="text-sm font-semibold">{option.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                    </button>
                  ))}
                </div>
              </FormField>

              <FieldGrid columns={2}>
                <FormField label="Currency code" error={form.formState.errors.currencyCode?.message}>
                  <Input placeholder="USD" maxLength={3} {...form.register("currencyCode")} />
                </FormField>
                <FormField
                  label="Base currency code (optional)"
                  error={form.formState.errors.baseCurrencyCode?.message}
                >
                  <Input placeholder="USD" maxLength={3} {...form.register("baseCurrencyCode")} />
                </FormField>
                <FormField label="Timezone" error={form.formState.errors.timezone?.message}>
                  <Input placeholder="Asia/Karachi" {...form.register("timezone")} />
                </FormField>
                <FormField
                  label="Fiscal year start month"
                  error={form.formState.errors.fiscalYearStartMonth?.message}
                >
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    {...form.register("fiscalYearStartMonth", { valueAsNumber: true })}
                  />
                </FormField>
              </FieldGrid>
            </div>
          ) : null}

          {/* Step 2 - Address & contact */}
          {step === 2 ? (
            <div className="space-y-5">
              <FieldGrid columns={2}>
                <FormField label="Address line 1" error={form.formState.errors.addressLine1?.message}>
                  <Input placeholder="123 Market Street" {...form.register("addressLine1")} />
                </FormField>
                <FormField label="Address line 2 (optional)" error={form.formState.errors.addressLine2?.message}>
                  <Input placeholder="Suite 200" {...form.register("addressLine2")} />
                </FormField>
                <FormField label="City" error={form.formState.errors.city?.message}>
                  <Input placeholder="Karachi" {...form.register("city")} />
                </FormField>
                <FormField label="State (optional)" error={form.formState.errors.state?.message}>
                  <Input placeholder="Sindh" {...form.register("state")} />
                </FormField>
                <FormField label="Postal code (optional)" error={form.formState.errors.postalCode?.message}>
                  <Input placeholder="74000" {...form.register("postalCode")} />
                </FormField>
                <FormField label="Country (optional)" error={form.formState.errors.country?.message}>
                  <Input placeholder="Pakistan" {...form.register("country")} />
                </FormField>
                <FormField label="Email" error={form.formState.errors.email?.message}>
                  <Input type="email" placeholder="billing@company.com" {...form.register("email")} />
                </FormField>
                <FormField label="Phone" error={form.formState.errors.phone?.message}>
                  <Input placeholder="+1 555 100 2200" {...form.register("phone")} />
                </FormField>
                <FormField label="Website (optional)" error={form.formState.errors.website?.message}>
                  <Input placeholder="https://company.com" {...form.register("website")} />
                </FormField>
              </FieldGrid>
            </div>
          ) : null}

          {/* Step 3 - Tax & branding */}
          {step === 3 ? (
            <div className="space-y-5">
              <FieldGrid columns={2}>
                <FormField
                  label="Tax registration number (optional)"
                  error={form.formState.errors.taxRegistrationNumber?.message}
                >
                  <Input placeholder="TAX-9912" {...form.register("taxRegistrationNumber")} />
                </FormField>
                <FormField label="Tax label (optional)" error={form.formState.errors.taxLabel?.message}>
                  <Input placeholder="VAT / GST / Sales Tax" {...form.register("taxLabel")} />
                </FormField>
              </FieldGrid>

              <FormField label="Company logo (optional)">
                {logo ? (
                  <img src={logo} alt="Company logo" className="mb-2 h-16 w-auto rounded-md border" />
                ) : null}
                <FileInput logo={logo} setlogo={setLogo} />
                <p className="mt-1 text-xs text-muted-foreground">
                  Appears on your invoices. You can change this later in Settings.
                </p>
              </FormField>
            </div>
          ) : null}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <Button type="button" variant="ghost" onClick={goBack} disabled={step === 1}>
              Back
            </Button>

            {step < STEPS.length ? (
              <Button type="button" onClick={goNext}>
                Continue
              </Button>
            ) : (
              <Button type="submit" isLoading={createCompanyMutation.isPending}>
                Create company
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldGrid } from "@/components/shared/field-grid";
import { FormField } from "@/components/shared/form-field";
import { SettingsSectionCard } from "@/components/settings/settings-section-card";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { canUsePermission } from "@/features/permissions/utils/module-permissions";
import {
  companySettingsSchema,
  type CompanySettingsFormInput,
  type CompanySettingsFormValues,
} from "@/features/settings/schemas/company-settings.schema";
import {
  useCompanySettings,
  useUpdateCompanySettings,
} from "@/features/settings/hooks/use-settings";
import { ErrorState } from "@/components/shared/error-state";
import FileInput from "@/components/ui/fileInput";
import { useState } from "react";

export function CompanySettingsPage() {
  const { companyId, permissions } = useActiveCompany();
  const canManage = canUsePermission(permissions, ["company.update", "settings.manage"]);
  const companySettingsQuery = useCompanySettings(companyId);
  const updateMutation = useUpdateCompanySettings(companyId);
  const [logo, setlogo] = useState(companySettingsQuery.data?.logoUrl ?? "")

  const form = useForm<CompanySettingsFormInput, undefined, CompanySettingsFormValues>({
    resolver: zodResolver(companySettingsSchema),
    values: {
      name: companySettingsQuery.data?.name ?? "",
      legalName: companySettingsQuery.data?.legalName ?? "",
      email: companySettingsQuery.data?.email ?? "",
      phone: companySettingsQuery.data?.phone ?? "",
      website: companySettingsQuery.data?.website ?? "",
      country: companySettingsQuery.data?.country ?? "",
      state: companySettingsQuery.data?.state ?? "",
      city: companySettingsQuery.data?.city ?? "",
      postalCode: companySettingsQuery.data?.postalCode ?? "",
      addressLine1: companySettingsQuery.data?.addressLine1 ?? "",
      addressLine2: companySettingsQuery.data?.addressLine2 ?? "",
      currency: companySettingsQuery.data?.currency ?? "",
      baseCurrencyCode: companySettingsQuery.data?.baseCurrencyCode ?? "",
      timezone: companySettingsQuery.data?.timezone ?? "",
      fiscalYearStartMonth: companySettingsQuery.data?.fiscalYearStartMonth ?? undefined,
      taxRegistrationNumber: companySettingsQuery.data?.taxRegistrationNumber ?? "",
      taxLabel: companySettingsQuery.data?.taxLabel ?? "",
      companyType: companySettingsQuery.data?.companyType ?? "",
      industry: companySettingsQuery.data?.industry ?? "",
      logoUrl: companySettingsQuery.data?.logoUrl ?? "",
      status: companySettingsQuery.data?.status ?? "",
    },
  });

  if (companySettingsQuery.error) {
    return (
      <ErrorState
        title="Unable to load company settings"
        description={companySettingsQuery.error.message}
      />
    );
  }

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(async (values) => {
        await updateMutation.mutateAsync({
          ...values,
          logoUrl: logo ?? null,
          fiscalYearStartMonth: values.fiscalYearStartMonth ?? null,
        });
      })}
    >
      {updateMutation.error ? <Alert title={updateMutation.error.message} variant="destructive" /> : null}

      <SettingsSectionCard
        description="Administrative company profile information used across documents and settings."
        title="Company Profile"
      >
        {logo && logo !== "" && <img src={logo} alt="Company Logo" />}
        <FieldGrid columns={2}>
          <FormField error={form.formState.errors.name?.message} label="Company name">
            <Input disabled={!canManage} {...form.register("name")} />
          </FormField>
          <FormField label="Legal name">
            <Input disabled={!canManage} {...form.register("legalName")} />
          </FormField>
          <FormField label="Email">
            <Input disabled={!canManage} {...form.register("email")} type="email" />
          </FormField>
          <FormField label="Phone">
            <Input disabled={!canManage} {...form.register("phone")} />
          </FormField>
          <FormField label="Website">
            <Input disabled={!canManage} {...form.register("website")} />
          </FormField>
          <FormField label="Industry">
            <Input disabled={!canManage} {...form.register("industry")} />
          </FormField>
          <FormField label="Company type">
            <Input disabled={!canManage} {...form.register("companyType")} />
          </FormField>
          <FormField label="Timezone">
            <Input disabled={!canManage} {...form.register("timezone")} />
          </FormField>
          <FormField label="Currency code">
            <Input disabled={!canManage} {...form.register("currency")} />
          </FormField>
          <FormField label="Base currency code">
            <Input disabled={!canManage} {...form.register("baseCurrencyCode")} />
          </FormField>
          <FormField label="Fiscal year start month">
            <Input disabled={!canManage} {...form.register("fiscalYearStartMonth")} type="number" />
          </FormField>
          <FormField label="Status">
            <Input disabled={!canManage} {...form.register("status")} />
          </FormField>
        </FieldGrid>
      </SettingsSectionCard>

      <SettingsSectionCard title="Address and tax registration">
        <FieldGrid columns={2}>
          <FormField label="Country">
            <Input disabled={!canManage} {...form.register("country")} />
          </FormField>
          <FormField label="State">
            <Input disabled={!canManage} {...form.register("state")} />
          </FormField>
          <FormField label="City">
            <Input disabled={!canManage} {...form.register("city")} />
          </FormField>
          <FormField label="Postal code">
            <Input disabled={!canManage} {...form.register("postalCode")} />
          </FormField>
          <FormField label="Address line 1">
            <Input disabled={!canManage} {...form.register("addressLine1")} />
          </FormField>
          <FormField label="Address line 2">
            <Input disabled={!canManage} {...form.register("addressLine2")} />
          </FormField>
          <FormField label="Tax registration number">
            <Input disabled={!canManage} {...form.register("taxRegistrationNumber")} />
          </FormField>
          <FormField label="Tax label">
            <Input disabled={!canManage} {...form.register("taxLabel")} />
          </FormField>
        </FieldGrid>
        <div className="mt-4">
          <FormField label="Logo URL">
            {/* <Input disabled={!canManage} {...form.register("logoUrl")} /> */}
         <FileInput logo={logo} setlogo={setlogo}/>
          </FormField>
        </div>
      </SettingsSectionCard>

      <div className="flex justify-end">
        <Button disabled={!canManage} isLoading={updateMutation.isPending} type="submit">
          Save company settings
        </Button>
      </div>
    </form>
  );
}

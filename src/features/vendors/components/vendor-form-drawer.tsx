import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CreateEditDrawer } from "@/components/shared/create-edit-drawer";
import { CurrencySelect } from "@/components/shared/currency-select";
import { FieldGrid } from "@/components/shared/field-grid";
import { FormField } from "@/components/shared/form-field";
import { FormSection } from "@/components/shared/form-section";
import type { ApiError } from "@/lib/api/types";
import {
  vendorSchema,
  type VendorFormInput,
  type VendorFormValues,
} from "@/features/vendors/schemas/vendor.schema";
import type { Vendor } from "@/features/vendors/types/vendor.types";

interface VendorFormDrawerProps {
  open: boolean;
  mode: "create" | "edit";
  vendor?: Vendor | null;
  companyCurrency?: string | null;
  isPending?: boolean;
  error?: ApiError | null;
  onClose: () => void;
  onSubmit: (values: VendorFormValues) => Promise<void> | void;
}

export function VendorFormDrawer({
  open,
  mode,
  vendor,
  companyCurrency,
  isPending,
  error,
  onClose,
  onSubmit,
}: VendorFormDrawerProps) {
  const currencyLocked = mode === "edit" && Boolean(vendor?.hasTransactions);

  const form = useForm<VendorFormInput, undefined, VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      vendorCode: "",
      displayName: "",
      legalName: "",
      contactPersonName: "",
      email: "",
      phone: "",
      mobile: "",
      website: "",
      taxRegistrationNumber: "",
      currencyCode: companyCurrency ?? "USD",
      paymentTermsDays: undefined,
      openingBalance: undefined,
      openingBalanceDate: "",
      billingAddressLine1: "",
      billingAddressLine2: "",
      billingCity: "",
      billingState: "",
      billingPostalCode: "",
      billingCountry: "",
      notes: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      vendorCode: vendor?.vendorCode ?? "",
      displayName: vendor?.displayName ?? "",
      legalName: vendor?.legalName ?? "",
      contactPersonName: vendor?.contactPersonName ?? "",
      email: vendor?.email ?? "",
      phone: vendor?.phone ?? "",
      mobile: vendor?.mobile ?? "",
      website: vendor?.website ?? "",
      taxRegistrationNumber: vendor?.taxRegistrationNumber ?? "",
      currencyCode: vendor?.currencyCode ?? companyCurrency ?? "USD",
      paymentTermsDays: vendor?.paymentTermsDays ?? undefined,
      openingBalance: vendor?.openingBalance ?? undefined,
      openingBalanceDate: vendor?.openingBalanceDate ?? "",
      billingAddressLine1: vendor?.billingAddressLine1 ?? "",
      billingAddressLine2: vendor?.billingAddressLine2 ?? "",
      billingCity: vendor?.billingCity ?? "",
      billingState: vendor?.billingState ?? "",
      billingPostalCode: vendor?.billingPostalCode ?? "",
      billingCountry: vendor?.billingCountry ?? "",
      notes: vendor?.notes ?? "",
      isActive: vendor?.isActive ?? true,
    });
  }, [companyCurrency, form, open, vendor]);

  return (
    <CreateEditDrawer
      description="Capture vendor profile, payment defaults, and purchasing contact details."
      footer={
        <div className="flex justify-end gap-3">
          <Button onClick={onClose} type="button" variant="ghost">
            Cancel
          </Button>
          <Button
            isLoading={isPending}
            onClick={form.handleSubmit(async (values) => onSubmit(values))}
            type="button"
          >
            {mode === "create" ? "Create vendor" : "Save changes"}
          </Button>
        </div>
      }
      onClose={onClose}
      open={open}
      title={mode === "create" ? "New vendor" : `Edit ${vendor?.displayName ?? "vendor"}`}
    >
      <form className="space-y-6">
        {error ? <Alert title={error.message} variant="destructive" /> : null}
        <FormSection title="Profile" description="Basic vendor identity and purchasing contacts.">
          <FieldGrid>
            <FormField label="Vendor code">
              <Input {...form.register("vendorCode")} placeholder="VEND-001" />
            </FormField>
            <FormField label="Display name" error={form.formState.errors.displayName?.message}>
              <Input {...form.register("displayName")} placeholder="Orbit Supplies" />
            </FormField>
            <FormField label="Legal name">
              <Input {...form.register("legalName")} />
            </FormField>
            <FormField label="Contact person">
              <Input {...form.register("contactPersonName")} />
            </FormField>
            <FormField label="Email" error={form.formState.errors.email?.message}>
              <Input {...form.register("email")} />
            </FormField>
            <FormField label="Phone">
              <Input {...form.register("phone")} />
            </FormField>
            <FormField label="Mobile">
              <Input {...form.register("mobile")} />
            </FormField>
            <FormField label="Website">
              <Input {...form.register("website")} />
            </FormField>
            <FormField label="Tax registration">
              <Input {...form.register("taxRegistrationNumber")} />
            </FormField>
          </FieldGrid>
        </FormSection>

        <FormSection title="Finance">
          <FieldGrid>
            <FormField
              label="Currency"
              helperText={
                currencyLocked
                  ? "Currency can't be changed after the first transaction."
                  : undefined
              }
            >
              <Controller
                control={form.control}
                name="currencyCode"
                render={({ field }) => (
                  <CurrencySelect
                    disabled={currencyLocked}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={field.onChange}
                    value={field.value}
                  />
                )}
              />
            </FormField>
            <FormField label="Payment terms (days)">
              <Input type="number" {...form.register("paymentTermsDays")} />
            </FormField>
            <FormField label="Opening balance">
              <Input type="number" step="0.01" {...form.register("openingBalance")} />
            </FormField>
            <FormField label="Opening balance date">
              <Input type="date" {...form.register("openingBalanceDate")} />
            </FormField>
          </FieldGrid>
        </FormSection>

        <FormSection title="Address">
          <FieldGrid>
            <FormField label="Address line 1">
              <Input {...form.register("billingAddressLine1")} />
            </FormField>
            <FormField label="Address line 2">
              <Input {...form.register("billingAddressLine2")} />
            </FormField>
            <FormField label="City">
              <Input {...form.register("billingCity")} />
            </FormField>
            <FormField label="State">
              <Input {...form.register("billingState")} />
            </FormField>
            <FormField label="Postal code">
              <Input {...form.register("billingPostalCode")} />
            </FormField>
            <FormField label="Country">
              <Input {...form.register("billingCountry")} />
            </FormField>
          </FieldGrid>
        </FormSection>

        <FormSection title="Notes and status">
          <FormField label="Notes">
            <Textarea {...form.register("notes")} />
          </FormField>
          <div className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3">
            <Checkbox
              checked={form.watch("isActive")}
              onChange={(event) => form.setValue("isActive", event.target.checked)}
            />
            <div>
              <p className="text-sm font-medium">Active vendor</p>
              <p className="text-xs text-muted-foreground">
                Inactive vendors stay available for history and reports.
              </p>
            </div>
          </div>
        </FormSection>
      </form>
    </CreateEditDrawer>
  );
}

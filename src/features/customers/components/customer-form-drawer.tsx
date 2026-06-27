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
  customerSchema,
  type CustomerFormInput,
  type CustomerFormValues,
} from "@/features/customers/schemas/customer.schema";
import type { Customer } from "@/features/customers/types/customer.types";

interface CustomerFormDrawerProps {
  open: boolean;
  mode: "create" | "edit";
  customer?: Customer | null;
  companyCurrency?: string | null;
  isPending?: boolean;
  error?: ApiError | null;
  onClose: () => void;
  onSubmit: (values: CustomerFormValues) => Promise<void> | void;
}

export function CustomerFormDrawer({
  open,
  mode,
  customer,
  companyCurrency,
  isPending,
  error,
  onClose,
  onSubmit,
}: CustomerFormDrawerProps) {
  const form = useForm<CustomerFormInput, undefined, CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      customerCode: "",
      displayName: "",
      legalName: "",
      firstName: "",
      lastName: "",
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
      shippingAddressLine1: "",
      shippingAddressLine2: "",
      shippingCity: "",
      shippingState: "",
      shippingPostalCode: "",
      shippingCountry: "",
      notes: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      customerCode: customer?.customerCode ?? "",
      displayName: customer?.displayName ?? "",
      legalName: customer?.legalName ?? "",
      firstName: customer?.firstName ?? "",
      lastName: customer?.lastName ?? "",
      email: customer?.email ?? "",
      phone: customer?.phone ?? "",
      mobile: customer?.mobile ?? "",
      website: customer?.website ?? "",
      taxRegistrationNumber: customer?.taxRegistrationNumber ?? "",
      currencyCode: customer?.currencyCode ?? companyCurrency ?? "USD",
      paymentTermsDays: customer?.paymentTermsDays ?? undefined,
      openingBalance: customer?.openingBalance ?? undefined,
      openingBalanceDate: customer?.openingBalanceDate ?? "",
      billingAddressLine1: customer?.billingAddressLine1 ?? "",
      billingAddressLine2: customer?.billingAddressLine2 ?? "",
      billingCity: customer?.billingCity ?? "",
      billingState: customer?.billingState ?? "",
      billingPostalCode: customer?.billingPostalCode ?? "",
      billingCountry: customer?.billingCountry ?? "",
      shippingAddressLine1: customer?.shippingAddressLine1 ?? "",
      shippingAddressLine2: customer?.shippingAddressLine2 ?? "",
      shippingCity: customer?.shippingCity ?? "",
      shippingState: customer?.shippingState ?? "",
      shippingPostalCode: customer?.shippingPostalCode ?? "",
      shippingCountry: customer?.shippingCountry ?? "",
      notes: customer?.notes ?? "",
      isActive: customer?.isActive ?? true,
    });
  }, [companyCurrency, customer, form, open]);

  return (
    <CreateEditDrawer
      description="Capture customer profile, contact, balances, and address information."
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
            {mode === "create" ? "Create customer" : "Save changes"}
          </Button>
        </div>
      }
      onClose={onClose}
      open={open}
      title={mode === "create" ? "New customer" : `Edit ${customer?.displayName ?? "customer"}`}
    >
      <form className="space-y-6">
        {error ? <Alert title={error.message} variant="destructive" /> : null}
        <FormSection title="Profile" description="Basic customer identity and contact details.">
          <FieldGrid>
            <FormField label="Customer code">
              <Input {...form.register("customerCode")} placeholder="CUST-001" />
            </FormField>
            <FormField label="Display name" error={form.formState.errors.displayName?.message}>
              <Input {...form.register("displayName")} placeholder="Acme Retail" />
            </FormField>
            <FormField label="Legal name">
              <Input {...form.register("legalName")} placeholder="Acme Retail LLC" />
            </FormField>
            <FormField label="Email" error={form.formState.errors.email?.message}>
              <Input {...form.register("email")} placeholder="billing@acme.com" />
            </FormField>
            <FormField label="First name">
              <Input {...form.register("firstName")} placeholder="Sarah" />
            </FormField>
            <FormField label="Last name">
              <Input {...form.register("lastName")} placeholder="Taylor" />
            </FormField>
            <FormField label="Phone">
              <Input {...form.register("phone")} placeholder="+1 555 100 2200" />
            </FormField>
            <FormField label="Mobile">
              <Input {...form.register("mobile")} placeholder="+1 555 222 3300" />
            </FormField>
            <FormField label="Website">
              <Input {...form.register("website")} placeholder="https://acme.com" />
            </FormField>
            <FormField label="Tax registration">
              <Input {...form.register("taxRegistrationNumber")} placeholder="TAX-9912" />
            </FormField>
          </FieldGrid>
        </FormSection>

        <FormSection title="Finance" description="Defaults used by invoices and balances.">
          <FieldGrid>
            <FormField label="Currency">
              <Controller
                control={form.control}
                name="currencyCode"
                render={({ field }) => (
                  <CurrencySelect
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={field.onChange}
                    value={field.value}
                  />
                )}
              />
            </FormField>
            <FormField label="Payment terms (days)">
              <Input type="number" {...form.register("paymentTermsDays")} placeholder="30" />
            </FormField>
            <FormField label="Opening balance">
              <Input type="number" step="0.01" {...form.register("openingBalance")} />
            </FormField>
            <FormField label="Opening balance date">
              <Input type="date" {...form.register("openingBalanceDate")} />
            </FormField>
          </FieldGrid>
        </FormSection>

        <FormSection title="Billing address">
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

        <FormSection title="Shipping address">
          <FieldGrid>
            <FormField label="Address line 1">
              <Input {...form.register("shippingAddressLine1")} />
            </FormField>
            <FormField label="Address line 2">
              <Input {...form.register("shippingAddressLine2")} />
            </FormField>
            <FormField label="City">
              <Input {...form.register("shippingCity")} />
            </FormField>
            <FormField label="State">
              <Input {...form.register("shippingState")} />
            </FormField>
            <FormField label="Postal code">
              <Input {...form.register("shippingPostalCode")} />
            </FormField>
            <FormField label="Country">
              <Input {...form.register("shippingCountry")} />
            </FormField>
          </FieldGrid>
        </FormSection>

        <FormSection title="Notes and status">
          <FormField label="Notes">
            <Textarea {...form.register("notes")} placeholder="Internal notes for sales and collections." />
          </FormField>
          <div className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3">
            <Checkbox
              checked={form.watch("isActive")}
              onChange={(event) => form.setValue("isActive", event.target.checked)}
            />
            <div>
              <p className="text-sm font-medium">Active customer</p>
              <p className="text-xs text-muted-foreground">
                Inactive customers remain in history but stop appearing in new transaction defaults.
              </p>
            </div>
          </div>
        </FormSection>
      </form>
    </CreateEditDrawer>
  );
}

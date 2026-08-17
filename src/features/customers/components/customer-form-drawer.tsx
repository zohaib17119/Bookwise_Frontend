import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { ApiErrorAlert } from "@/components/shared/api-error-alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdvancedSection } from "@/components/shared/advanced-section";
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
import { toOptionalDecimalString } from "@/features/shared/utils/decimal-string";
import { useNextCustomerCode } from "@/features/customers/hooks/use-customers";

function todayIsoDate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

interface CustomerFormDrawerProps {
  open: boolean;
  mode: "create" | "edit";
  customer?: Customer | null;
  companyId?: string;
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
  companyId,
  companyCurrency,
  isPending,
  error,
  onClose,
  onSubmit,
}: CustomerFormDrawerProps) {
  const currencyLocked = mode === "edit" && Boolean(customer?.hasTransactions);
  const nextCodeQuery = useNextCustomerCode(companyId, open && mode === "create");

  const form = useForm<CustomerFormInput, undefined, CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    mode: "onSubmit",
    defaultValues: {
      customerCode: "",
      displayName: "",
      legalName: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      mobile: "",
      contactPersonDepartment: "",
      website: "",
      taxRegistrationNumber: "",
      currencyCode: companyCurrency ?? "USD",
      paymentTermsDays: 30,
      openingBalance: "0",
      openingBalanceDate: todayIsoDate(),
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
      contactPersonDepartment: customer?.contactPersonDepartment ?? "",
      website: customer?.website ?? "",
      taxRegistrationNumber: customer?.taxRegistrationNumber ?? "",
      currencyCode: customer?.currencyCode ?? companyCurrency ?? "USD",
      paymentTermsDays: customer?.paymentTermsDays ?? 30,
      openingBalance:
        customer?.openingBalance != null
          ? toOptionalDecimalString(customer.openingBalance) ?? "0"
          : "0",
      openingBalanceDate: customer?.openingBalanceDate
        ? String(customer.openingBalanceDate).slice(0, 10)
        : todayIsoDate(),
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

  useEffect(() => {
    if (!open || mode !== "create" || !nextCodeQuery.data) return;
    if (!form.getValues("customerCode")) {
      form.setValue("customerCode", nextCodeQuery.data);
    }
  }, [form, mode, nextCodeQuery.data, open]);

  return (
    <CreateEditDrawer
      description="Only legal name is required. Everything else is optional or has defaults."
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
        <ApiErrorAlert error={error} />
        <FormSection
          title="Essentials"
          description="Fast entry fields. Code is auto-filled and editable."
        >
          <FieldGrid>
            <FormField label="Tax registration / NTN (optional)">
              <Input {...form.register("taxRegistrationNumber")} placeholder="NTN / VAT / TRN" />
            </FormField>
            <FormField error={form.formState.errors.legalName?.message} label="Legal name">
              <Input {...form.register("legalName")} placeholder="Acme Retail LLC" />
            </FormField>
            <FormField
              helperText="Optional. Defaults to legal name if left blank."
              label="Display name"
            >
              <Input {...form.register("displayName")} placeholder="Acme Retail" />
            </FormField>
            <FormField
              helperText="Auto-generated. You can change it before saving."
              label="Customer code"
            >
              <Input {...form.register("customerCode")} placeholder="CUST-01" />
            </FormField>
          </FieldGrid>
        </FormSection>

        <AdvancedSection
          title="More details (optional)"
          description="Contact, finance, addresses, and notes — add only if you need them."
          defaultOpen={mode === "edit"}
        >
          <div className="space-y-6">
            <FormSection title="Contact">
              <FieldGrid>
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
                <FormField label="Department">
                  <Input {...form.register("contactPersonDepartment")} placeholder="Sales, Admin…" />
                </FormField>
                <FormField label="Website">
                  <Input {...form.register("website")} placeholder="https://acme.com" />
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
                      : "Defaults to your company currency."
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
                <FormField helperText="Defaults to 30 days." label="Payment terms (days)">
                  <Input type="number" {...form.register("paymentTermsDays")} />
                </FormField>
                <FormField helperText="Defaults to 0." label="Opening balance">
                  <Input type="number" step="0.01" {...form.register("openingBalance")} />
                </FormField>
                <FormField helperText="Defaults to today." label="Opening balance date">
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
                <Textarea
                  {...form.register("notes")}
                  placeholder="Internal notes for sales and collections."
                />
              </FormField>
              <div className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3">
                <Checkbox
                  checked={form.watch("isActive")}
                  onChange={(event) => form.setValue("isActive", event.target.checked)}
                />
                <div>
                  <p className="text-sm font-medium">Active customer</p>
                  <p className="text-xs text-muted-foreground">
                    Inactive customers remain in history but stop appearing in new transaction
                    defaults.
                  </p>
                </div>
              </div>
            </FormSection>
          </div>
        </AdvancedSection>
      </form>
    </CreateEditDrawer>
  );
}

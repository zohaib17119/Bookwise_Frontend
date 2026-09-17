import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { ApiErrorAlert } from "@/components/shared/api-error-alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AdvancedSection } from "@/components/shared/advanced-section";
import { CreateEditDrawer } from "@/components/shared/create-edit-drawer";
import { CurrencySelect } from "@/components/shared/currency-select";
import { FieldGrid } from "@/components/shared/field-grid";
import { FormField } from "@/components/shared/form-field";
import { FormSection } from "@/components/shared/form-section";
import type { ApiError } from "@/lib/api/types";
import {
  buildCustomerSchema,
  normalizeFbrNtnCnicInput,
  type CustomerFormInput,
  type CustomerFormValues,
} from "@/features/customers/schemas/customer.schema";
import type { Customer } from "@/features/customers/types/customer.types";
import { toOptionalDecimalString } from "@/features/shared/utils/decimal-string";
import { useNextCustomerCode } from "@/features/customers/hooks/use-customers";
import { useFbrRefProvinces } from "@/features/settings/hooks/use-fbr-reference";

function todayIsoDate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function shippingAddressesFromCustomer(customer?: Customer | null) {
  if (customer?.shippingAddresses?.length) {
    return customer.shippingAddresses.map((address) => ({
      id: address.id ?? "",
      label: address.label ?? "",
      addressLine1: address.addressLine1 ?? "",
      addressLine2: address.addressLine2 ?? "",
      city: address.city ?? "",
      state: address.state ?? "",
      postalCode: address.postalCode ?? "",
      country: address.country ?? "",
    }));
  }
  if (
    customer?.shippingAddressLine1 ||
    customer?.shippingAddressLine2 ||
    customer?.shippingCity ||
    customer?.shippingState ||
    customer?.shippingPostalCode ||
    customer?.shippingCountry
  ) {
    return [
      {
        id: "",
        label: "Shipping",
        addressLine1: customer.shippingAddressLine1 ?? "",
        addressLine2: customer.shippingAddressLine2 ?? "",
        city: customer.shippingCity ?? "",
        state: customer.shippingState ?? "",
        postalCode: customer.shippingPostalCode ?? "",
        country: customer.shippingCountry ?? "",
      },
    ];
  }
  return [];
}

interface CustomerFormDrawerProps {
  open: boolean;
  mode: "create" | "edit";
  customer?: Customer | null;
  companyId?: string;
  companyCurrency?: string | null;
  showFbrFields?: boolean;
  /** When true, FBR DI buyer fields are required on the form. */
  requireFbrDi?: boolean;
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
  showFbrFields = false,
  requireFbrDi = false,
  isPending,
  error,
  onClose,
  onSubmit,
}: CustomerFormDrawerProps) {
  const currencyLocked = mode === "edit" && Boolean(customer?.hasTransactions);
  const nextCodeQuery = useNextCustomerCode(companyId, open && mode === "create");
  const provincesQuery = useFbrRefProvinces(companyId, "", open && showFbrFields);
  const schema = useMemo(() => buildCustomerSchema(requireFbrDi), [requireFbrDi]);

  const form = useForm<CustomerFormInput, undefined, CustomerFormValues>({
    resolver: zodResolver(schema),
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
      fbrRegistrationType: null,
      fbrProvince: "",
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
      shippingAddresses: [],
      notes: "",
      isActive: true,
    },
  });

  const shippingFields = useFieldArray({
    control: form.control,
    name: "shippingAddresses",
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
      fbrRegistrationType: customer?.fbrRegistrationType ?? null,
      fbrProvince: customer?.fbrProvince ?? "",
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
      shippingAddresses: shippingAddressesFromCustomer(customer),
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

  const taxRegistrationField = form.register("taxRegistrationNumber");

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
            onClick={form.handleSubmit(async (values) => {
              const next = { ...values };
              if (showFbrFields) {
                next.taxRegistrationNumber = normalizeFbrNtnCnicInput(values.taxRegistrationNumber);
              }
              await onSubmit(next);
            })}
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
            <FormField
              error={form.formState.errors.taxRegistrationNumber?.message}
                helperText={
                  showFbrFields
                    ? "FBR DI: C831684-3 becomes C831684 (letter kept, dash + check digit dropped). Or 7/9 digit NTN / 13-digit CNIC."
                    : undefined
                }
              label={requireFbrDi ? "Tax registration / NTN" : "Tax registration / NTN (optional)"}
            >
              <Input
                {...taxRegistrationField}
                onBlur={(event) => {
                  taxRegistrationField.onBlur(event);
                  if (!showFbrFields) return;
                  const cleaned = normalizeFbrNtnCnicInput(event.target.value);
                  if (cleaned !== event.target.value) {
                    form.setValue("taxRegistrationNumber", cleaned, { shouldValidate: true });
                  }
                }}
                placeholder={showFbrFields ? "e.g. C831684-3 or C831684" : "NTN / VAT / TRN"}
              />
            </FormField>
            {showFbrFields ? (
              <>
                <FormField
                  error={form.formState.errors.fbrRegistrationType?.message}
                  helperText="FBR buyer registration type for Digital Invoicing."
                  label={requireFbrDi ? "FBR registration type" : "FBR registration type (optional)"}
                >
                  <Select
                    {...form.register("fbrRegistrationType", {
                      setValueAs: (value) => (value === "" ? null : value),
                    })}
                    value={form.watch("fbrRegistrationType") ?? ""}
                  >
                    <option value="">{requireFbrDi ? "Select…" : "Not set"}</option>
                    <option value="REGISTERED">Registered</option>
                    <option value="UNREGISTERED">Unregistered</option>
                  </Select>
                </FormField>
                <FormField
                  error={form.formState.errors.fbrProvince?.message}
                  helperText="Must match FBR province reference names."
                  label={requireFbrDi ? "FBR province" : "FBR province (optional)"}
                >
                  <Select {...form.register("fbrProvince")} value={form.watch("fbrProvince") ?? ""}>
                    <option value="">{requireFbrDi ? "Select province…" : "Not set"}</option>
                    {form.watch("fbrProvince") &&
                    !(provincesQuery.data ?? []).some((p) => p.description === form.watch("fbrProvince")) ? (
                      <option value={form.watch("fbrProvince")!}>{form.watch("fbrProvince")}</option>
                    ) : null}
                    {(provincesQuery.data ?? []).map((p) => (
                      <option key={p.id} value={p.description}>
                        {p.description}
                      </option>
                    ))}
                  </Select>
                  {provincesQuery.isError ? (
                    <p className="mt-1 text-xs text-destructive">
                      Could not load FBR provinces. Restart backend or use Settings → FBR → Refresh FBR lists.
                    </p>
                  ) : null}
                  {!provincesQuery.isError &&
                  provincesQuery.isFetched &&
                  (provincesQuery.data?.length ?? 0) === 0 ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      No provinces yet. Open Settings → FBR → Refresh FBR lists, then reopen this form.
                    </p>
                  ) : null}
                </FormField>
              </>
            ) : null}
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
                        onChange={field.onChange}
                        value={field.value ?? ""}
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
                <FormField helperText="Defaults to today." label="Opening balance date">
                  <Input type="date" {...form.register("openingBalanceDate")} />
                </FormField>
              </FieldGrid>
            </FormSection>

            <FormSection title="Billing address">
              <FieldGrid>
                <FormField
                  error={form.formState.errors.billingAddressLine1?.message}
                  label={requireFbrDi ? "Address line 1" : "Address line 1"}
                >
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

            <FormSection
              description="Optional. Add up to 10 labeled locations (warehouse, factory, head office)."
              title="Shipping addresses"
            >
              <div className="space-y-4">
                {shippingFields.fields.map((field, index) => (
                  <div className="space-y-3 rounded-xl border p-3" key={field.id}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">Address {index + 1}</p>
                      <Button
                        onClick={() => shippingFields.remove(index)}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        Remove
                      </Button>
                    </div>
                    <FieldGrid>
                      <FormField
                        error={form.formState.errors.shippingAddresses?.[index]?.label?.message}
                        label="Label"
                      >
                        <Input
                          {...form.register(`shippingAddresses.${index}.label`)}
                          placeholder="Warehouse / Factory / Head office"
                        />
                      </FormField>
                      <FormField label="Address line 1">
                        <Input {...form.register(`shippingAddresses.${index}.addressLine1`)} />
                      </FormField>
                      <FormField label="Address line 2">
                        <Input {...form.register(`shippingAddresses.${index}.addressLine2`)} />
                      </FormField>
                      <FormField label="City">
                        <Input {...form.register(`shippingAddresses.${index}.city`)} />
                      </FormField>
                      <FormField label="State">
                        <Input {...form.register(`shippingAddresses.${index}.state`)} />
                      </FormField>
                      <FormField label="Postal code">
                        <Input {...form.register(`shippingAddresses.${index}.postalCode`)} />
                      </FormField>
                      <FormField label="Country">
                        <Input {...form.register(`shippingAddresses.${index}.country`)} />
                      </FormField>
                    </FieldGrid>
                  </div>
                ))}
                <Button
                  disabled={shippingFields.fields.length >= 10}
                  onClick={() =>
                    shippingFields.append({
                      id: "",
                      label: "",
                      addressLine1: "",
                      addressLine2: "",
                      city: "",
                      state: "",
                      postalCode: "",
                      country: "",
                    })
                  }
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  Add shipping address
                </Button>
              </div>
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

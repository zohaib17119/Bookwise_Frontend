import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ApiErrorAlert } from "@/components/shared/api-error-alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CreateEditDrawer } from "@/components/shared/create-edit-drawer";
import { FieldGrid } from "@/components/shared/field-grid";
import { FormField } from "@/components/shared/form-field";
import { FormSection } from "@/components/shared/form-section";
import type { ApiError } from "@/lib/api/types";
import { getFirstFieldError } from "@/lib/api/error";
import {
  accountSchema,
  type AccountFormValues,
} from "@/features/accounts/schemas/account.schema";
import type { Account } from "@/features/accounts/types/account.types";

interface AccountFormDrawerProps {
  open: boolean;
  mode: "create" | "edit";
  account?: Account | null;
  parentAccounts: Account[];
  companyCurrency?: string | null;
  isPending?: boolean;
  error?: ApiError | null;
  onClose: () => void;
  onSubmit: (values: AccountFormValues) => Promise<void> | void;
}

const accountTypeOptions = [
  "ASSET",
  "LIABILITY",
  "EQUITY",
  "INCOME",
  "EXPENSE",
  "COST_OF_GOODS_SOLD",
  "BANK",
  "ACCOUNTS_RECEIVABLE",
  "ACCOUNTS_PAYABLE",
  "TAX",
  "OTHER",
] as const;

export function AccountFormDrawer({
  open,
  mode,
  account,
  parentAccounts,
  companyCurrency,
  isPending,
  error,
  onClose,
  onSubmit,
}: AccountFormDrawerProps) {
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      type: "ASSET",
      subtype: "",
      normalSide: "DEBIT",
      parentAccountId: null,
      currencyCode: companyCurrency ?? "USD",
      isActive: true,
    },
  });

  useEffect(() => {
    if (!open) return;

    form.reset({
      code: account?.code ?? "",
      name: account?.name ?? "",
      description: account?.description ?? "",
      type: account?.type ?? "ASSET",
      subtype: account?.subtype ?? "",
      normalSide: account?.normalSide ?? "DEBIT",
      parentAccountId: account?.parentAccountId ?? null,
      currencyCode: account?.currencyCode ?? companyCurrency ?? "USD",
      isActive: account?.isActive ?? true,
    });
  }, [account, companyCurrency, form, open]);

  return (
    <CreateEditDrawer
      description="Maintain a company-scoped ledger structure aligned with your backend chart of accounts module."
      footer={
        <div className="flex justify-end gap-3">
          <Button onClick={onClose} type="button" variant="ghost">
            Cancel
          </Button>
          <Button
            isLoading={isPending}
            onClick={form.handleSubmit(async (values) => {
              await onSubmit(values);
            })}
            type="button"
          >
            {mode === "create" ? "Create account" : "Save changes"}
          </Button>
        </div>
      }
      onClose={onClose}
      open={open}
      title={mode === "create" ? "New account" : `Edit ${account?.name ?? "account"}`}
    >
      <form className="space-y-6">
        <ApiErrorAlert error={error} />

        <FormSection
          description="Core account identity and financial behavior."
          title="Account details"
        >
          <FieldGrid>
            <FormField
              error={form.formState.errors.code?.message ?? getFirstFieldError(error, "code")}
              label="Code"
            >
              <Input placeholder="1000" {...form.register("code")} />
            </FormField>
            <FormField
              error={form.formState.errors.name?.message ?? getFirstFieldError(error, "name")}
              label="Name"
            >
              <Input placeholder="Cash on Hand" {...form.register("name")} />
            </FormField>
            <FormField
              error={form.formState.errors.type?.message ?? getFirstFieldError(error, "type")}
              label="Type"
            >
              <Select {...form.register("type")}>
                {accountTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              error={
                form.formState.errors.normalSide?.message ??
                getFirstFieldError(error, "normalSide")
              }
              label="Normal side"
            >
              <Select {...form.register("normalSide")}>
                <option value="DEBIT">Debit</option>
                <option value="CREDIT">Credit</option>
              </Select>
            </FormField>
            <FormField
              error={form.formState.errors.subtype?.message ?? getFirstFieldError(error, "subtype")}
              label="Subtype"
            >
              <Input placeholder="Current asset" {...form.register("subtype")} />
            </FormField>
            <FormField
              error={
                form.formState.errors.currencyCode?.message ??
                getFirstFieldError(error, "currencyCode")
              }
              label="Currency"
            >
              <Input maxLength={3} placeholder="USD" {...form.register("currencyCode")} />
            </FormField>
            <FormField
              error={
                form.formState.errors.parentAccountId?.message ??
                getFirstFieldError(error, "parentAccountId")
              }
              label="Parent account"
            >
              <Select {...form.register("parentAccountId", {
                setValueAs: (value) => value === "" ? null : value
              })}>
                <option value={""}>No parent</option>
                {parentAccounts.map((option) => (
                  <option key={option.id} value={option.id}>
                    {(option.code ? `${option.code} - ` : "") + option.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <div className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3">
              <Checkbox
                checked={form.watch("isActive")}
                onChange={(event) => form.setValue("isActive", event.target.checked)}
              />
              <div>
                <p className="text-sm font-medium">Active account</p>
                <p className="text-xs text-muted-foreground">
                  Inactive accounts remain in history but are hidden from new selections.
                </p>
              </div>
            </div>
          </FieldGrid>
          <FormField
            error={
              form.formState.errors.description?.message ??
              getFirstFieldError(error, "description")
            }
            label="Description"
          >
            <Textarea
              placeholder="Optional context for accountants and reporting."
              {...form.register("description")}
            />
          </FormField>
        </FormSection>
      </form>
    </CreateEditDrawer>
  );
}

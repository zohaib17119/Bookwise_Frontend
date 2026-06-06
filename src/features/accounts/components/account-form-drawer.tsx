import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
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
        {error ? <Alert title={error.message} variant="destructive" /> : null}

        <FormSection
          description="Core account identity and financial behavior."
          title="Account details"
        >
          <FieldGrid>
            <FormField
              error={form.formState.errors.code?.message ?? error?.fieldErrors?.code?.[0]}
              label="Code"
            >
              <Input placeholder="1000" {...form.register("code")} />
            </FormField>
            <FormField
              error={form.formState.errors.name?.message ?? error?.fieldErrors?.name?.[0]}
              label="Name"
            >
              <Input placeholder="Cash on Hand" {...form.register("name")} />
            </FormField>
            <FormField
              error={form.formState.errors.type?.message ?? error?.fieldErrors?.type?.[0]}
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
                error?.fieldErrors?.normalSide?.[0]
              }
              label="Normal side"
            >
              <Select {...form.register("normalSide")}>
                <option value="DEBIT">Debit</option>
                <option value="CREDIT">Credit</option>
              </Select>
            </FormField>
            <FormField
              error={form.formState.errors.subtype?.message ?? error?.fieldErrors?.subtype?.[0]}
              label="Subtype"
            >
              <Input placeholder="Current asset" {...form.register("subtype")} />
            </FormField>
            <FormField
              error={
                form.formState.errors.currencyCode?.message ??
                error?.fieldErrors?.currencyCode?.[0]
              }
              label="Currency"
            >
              <Input maxLength={3} placeholder="USD" {...form.register("currencyCode")} />
            </FormField>
            <FormField
              error={
                form.formState.errors.parentAccountId?.message ??
                error?.fieldErrors?.parentAccountId?.[0]
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
              error?.fieldErrors?.description?.[0]
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

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { CreateEditDrawer } from "@/components/shared/create-edit-drawer";
import { FieldGrid } from "@/components/shared/field-grid";
import { FormField } from "@/components/shared/form-field";
import { AccountSelect } from "@/components/accounting/account-select";
import { bankAccountSchema, type BankAccountFormInput, type BankAccountFormValues } from "@/features/banking/schemas/bank-account.schema";
import type { BankAccount } from "@/features/banking/types/banking.types";
import type { Account } from "@/features/accounts/types/account.types";

interface BankAccountFormDrawerProps {
  open: boolean;
  mode: "create" | "edit";
  bankAccount?: BankAccount | null;
  accountOptions: Account[];
  isPending?: boolean;
  error?: Error | null;
  onClose: () => void;
  onSubmit: (values: BankAccountFormValues) => Promise<void>;
}

export function BankAccountFormDrawer({
  open,
  mode,
  bankAccount,
  accountOptions,
  isPending,
  error,
  onClose,
  onSubmit,
}: BankAccountFormDrawerProps) {
  const form = useForm<BankAccountFormInput, undefined, BankAccountFormValues>({
    resolver: zodResolver(bankAccountSchema),
    values: {
      linkedAccountId: bankAccount?.linkedAccountId ?? "",
      name: bankAccount?.name ?? "",
      accountNumberMasked: bankAccount?.accountNumberMasked ?? "",
      bankName: bankAccount?.bankName ?? "",
      branchName: bankAccount?.branchName ?? "",
      currencyCode: bankAccount?.currencyCode ?? "USD",
      openingBalance: bankAccount?.openingBalance ?? 0,
      openingBalanceDate: bankAccount?.openingBalanceDate ?? "",
      isPrimary: bankAccount?.isPrimary ?? false,
      isActive: bankAccount?.isActive ?? true,
    },
  });

  return (
    <CreateEditDrawer
      description="Configure a company bank account and map it to the corresponding ledger account."
      footer={
        <div className="flex justify-end gap-3">
          <Button onClick={onClose} type="button" variant="ghost">
            Cancel
          </Button>
          <Button isLoading={isPending} onClick={form.handleSubmit(onSubmit)} type="button">
            {mode === "create" ? "Create bank account" : "Save bank account"}
          </Button>
        </div>
      }
      onClose={onClose}
      open={open}
      title={mode === "create" ? "New Bank Account" : "Edit Bank Account"}
    >
      <form className="space-y-5">
        {error ? <Alert title={error.message} variant="destructive" /> : null}
        <AccountSelect
          error={form.formState.errors.linkedAccountId?.message}
          label="Linked ledger account"
          onChange={(value) => form.setValue("linkedAccountId", value)}
          options={accountOptions}
          value={form.watch("linkedAccountId")}
        />
        <FieldGrid>
          <FormField error={form.formState.errors.name?.message} label="Account name">
            <Input {...form.register("name")} placeholder="Operating bank account" />
          </FormField>
          <FormField label="Masked account number">
            <Input {...form.register("accountNumberMasked")} placeholder="****1234" />
          </FormField>
          <FormField label="Bank name">
            <Input {...form.register("bankName")} placeholder="ABC Bank" />
          </FormField>
          <FormField label="Branch name">
            <Input {...form.register("branchName")} placeholder="Main branch" />
          </FormField>
          <FormField label="Currency">
            <Input maxLength={3} {...form.register("currencyCode")} placeholder="USD" />
          </FormField>
          <FormField label="Opening balance">
            <Input step="0.01" type="number" {...form.register("openingBalance")} />
          </FormField>
          <FormField label="Opening balance date">
            <Input type="date" {...form.register("openingBalanceDate")} />
          </FormField>
        </FieldGrid>
        <div className="space-y-3 text-sm">
          <label className="flex items-center gap-2">
            <Checkbox
              checked={form.watch("isPrimary")}
              onChange={(event) => form.setValue("isPrimary", event.target.checked)}
            />
            Primary account
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={form.watch("isActive")}
              onChange={(event) => form.setValue("isActive", event.target.checked)}
            />
            Active
          </label>
        </div>
      </form>
    </CreateEditDrawer>
  );
}

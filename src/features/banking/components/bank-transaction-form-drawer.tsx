import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CreateEditDrawer } from "@/components/shared/create-edit-drawer";
import { FieldGrid } from "@/components/shared/field-grid";
import { FormField } from "@/components/shared/form-field";
import { bankTransactionSchema, type BankTransactionFormInput, type BankTransactionFormValues } from "@/features/banking/schemas/bank-transaction.schema";
import type { BankAccount, BankTransaction } from "@/features/banking/types/banking.types";

interface BankTransactionFormDrawerProps {
  open: boolean;
  mode: "create" | "edit";
  bankTransaction?: BankTransaction | null;
  bankAccounts: BankAccount[];
  isPending?: boolean;
  error?: Error | null;
  onClose: () => void;
  onSubmit: (values: BankTransactionFormValues) => Promise<void>;
}

export function BankTransactionFormDrawer({
  open,
  mode,
  bankTransaction,
  bankAccounts,
  isPending,
  error,
  onClose,
  onSubmit,
}: BankTransactionFormDrawerProps) {
  const form = useForm<BankTransactionFormInput, undefined, BankTransactionFormValues>({
    resolver: zodResolver(bankTransactionSchema),
    values: {
      bankAccountId: bankTransaction?.bankAccountId ?? "",
      transactionDate: bankTransaction?.transactionDate ?? "",
      description: bankTransaction?.description ?? "",
      amount: bankTransaction?.amount ?? 0,
      type: bankTransaction?.type ?? "",
      direction: bankTransaction?.direction ?? "",
      source: bankTransaction?.source ?? "",
    },
  });

  return (
    <CreateEditDrawer
      description="Capture manual bank transactions and prepare them for matching or reconciliation."
      footer={
        <div className="flex justify-end gap-3">
          <Button onClick={onClose} type="button" variant="ghost">
            Cancel
          </Button>
          <Button isLoading={isPending} onClick={form.handleSubmit(onSubmit)} type="button">
            {mode === "create" ? "Create transaction" : "Save transaction"}
          </Button>
        </div>
      }
      onClose={onClose}
      open={open}
      title={mode === "create" ? "New Bank Transaction" : "Edit Bank Transaction"}
    >
      <form className="space-y-5">
        {error ? <Alert title={error.message} variant="destructive" /> : null}
        <FieldGrid>
          <FormField error={form.formState.errors.bankAccountId?.message} label="Bank account">
            <Select {...form.register("bankAccountId")}>
              <option value="">Select bank account</option>
              {bankAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Transaction date">
            <Input type="date" {...form.register("transactionDate")} />
          </FormField>
          <FormField error={form.formState.errors.amount?.message} label="Amount">
            <Input step="0.01" type="number" {...form.register("amount")} />
          </FormField>
          <FormField label="Type">
            <Input {...form.register("type")} placeholder="Deposit, withdrawal, fee" />
          </FormField>
          <FormField label="Direction">
            <Select {...form.register("direction")}>
              <option value="">Select direction</option>
              <option value="IN">Inflow</option>
              <option value="OUT">Outflow</option>
            </Select>
          </FormField>
          <FormField label="Source">
            <Input {...form.register("source")} placeholder="Bank feed, manual, import" />
          </FormField>
        </FieldGrid>
        <FormField label="Description">
          <Textarea {...form.register("description")} placeholder="Describe the bank transaction" />
        </FormField>
      </form>
    </CreateEditDrawer>
  );
}

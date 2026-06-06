import { Plus, Trash2 } from "lucide-react";
import {
  Controller,
  useFieldArray,
  type Control,
  type FieldArrayPath,
  type FieldValues,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AccountSelect } from "@/components/accounting/account-select";
import type { Account } from "@/features/accounts/types/account.types";

interface JournalLineEditorProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldArrayPath<TFieldValues>;
  accounts: Account[];
  disabled?: boolean;
}

export function JournalLineEditor<TFieldValues extends FieldValues>({
  control,
  name,
  accounts,
  disabled,
}: JournalLineEditorProps<TFieldValues>) {
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-border/70 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-secondary/50">
            <tr>
              <th className="px-3 py-3">Account</th>
              <th className="px-3 py-3">Description</th>
              <th className="px-3 py-3">Debit</th>
              <th className="px-3 py-3">Credit</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => (
              <tr className="border-t border-border/60" key={field.id}>
                <td className="min-w-[220px] px-3 py-3">
                  <Controller
                    control={control}
                    name={`${name}.${index}.accountId` as never}
                    render={({ field: inputField }) => (
                      <AccountSelect
                        label=""
                        onChange={inputField.onChange}
                        options={accounts}
                        value={(inputField.value as string | undefined) ?? ""}
                      />
                    )}
                  />
                </td>
                <td className="min-w-[240px] px-3 py-3">
                  <Controller
                    control={control}
                    name={`${name}.${index}.description` as never}
                    render={({ field: inputField }) => (
                      <Input
                        disabled={disabled}
                        {...inputField}
                        value={(inputField.value as string | undefined) ?? ""}
                      />
                    )}
                  />
                </td>
                <td className="w-[140px] px-3 py-3">
                  <Controller
                    control={control}
                    name={`${name}.${index}.debitAmount` as never}
                    render={({ field: inputField }) => (
                      <Input
                        disabled={disabled}
                        min="0"
                        step="0.01"
                        type="number"
                        {...inputField}
                        value={(inputField.value as number | string | undefined) ?? ""}
                      />
                    )}
                  />
                </td>
                <td className="w-[140px] px-3 py-3">
                  <Controller
                    control={control}
                    name={`${name}.${index}.creditAmount` as never}
                    render={({ field: inputField }) => (
                      <Input
                        disabled={disabled}
                        min="0"
                        step="0.01"
                        type="number"
                        {...inputField}
                        value={(inputField.value as number | string | undefined) ?? ""}
                      />
                    )}
                  />
                </td>
                <td className="px-3 py-3">
                  <Button
                    disabled={disabled}
                    onClick={() => remove(index)}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button
        disabled={disabled}
        onClick={() =>
          append({
            accountId: "",
            description: "",
            debitAmount: 0,
            creditAmount: 0,
          } as never)
        }
        type="button"
        variant="secondary"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add journal line
      </Button>
    </div>
  );
}

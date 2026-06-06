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
import { Select } from "@/components/ui/select";
import type { Item } from "@/features/items/types/item.types";

interface AdjustmentLineEditorProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldArrayPath<TFieldValues>;
  items: Item[];
  disabled?: boolean;
}

export function AdjustmentLineEditor<TFieldValues extends FieldValues>({
  control,
  name,
  items,
  disabled,
}: AdjustmentLineEditorProps<TFieldValues>) {
  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-border/70 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-secondary/50">
            <tr>
              <th className="px-3 py-3">Item</th>
              <th className="px-3 py-3">Direction</th>
              <th className="px-3 py-3">Quantity</th>
              <th className="px-3 py-3">Unit Cost</th>
              <th className="px-3 py-3">Notes</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => (
              <tr className="border-t border-border/60" key={field.id}>
                <td className="min-w-[220px] px-3 py-3">
                  <Controller
                    control={control}
                    name={`${name}.${index}.itemId` as never}
                    render={({ field: inputField }) => (
                      <Select
                        disabled={disabled}
                        onChange={(event) => inputField.onChange(event.target.value)}
                        value={(inputField.value as string | undefined) ?? ""}
                      >
                        <option value="">Select item</option>
                        {items.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </Select>
                    )}
                  />
                </td>
                <td className="w-[140px] px-3 py-3">
                  <Controller
                    control={control}
                    name={`${name}.${index}.direction` as never}
                    render={({ field: inputField }) => (
                      <Select
                        disabled={disabled}
                        onChange={(event) => inputField.onChange(event.target.value)}
                        value={(inputField.value as string | undefined) ?? ""}
                      >
                        <option value="IN">Increase</option>
                        <option value="OUT">Decrease</option>
                      </Select>
                    )}
                  />
                </td>
                <td className="w-[120px] px-3 py-3">
                  <Controller
                    control={control}
                    name={`${name}.${index}.quantity` as never}
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
                    name={`${name}.${index}.unitCost` as never}
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
                <td className="min-w-[220px] px-3 py-3">
                  <Controller
                    control={control}
                    name={`${name}.${index}.notes` as never}
                    render={({ field: inputField }) => (
                      <Input
                        disabled={disabled}
                        {...inputField}
                        value={(inputField.value as string | undefined) ?? ""}
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
            itemId: "",
            direction: "IN",
            quantity: 0,
            unitCost: 0,
            notes: "",
          } as never)
        }
        type="button"
        variant="secondary"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add adjustment line
      </Button>
    </div>
  );
}

import { useCallback, useMemo } from "react";
import { Plus, Trash2, GripVertical, Package } from "lucide-react";
import {
  Controller,
  useFieldArray,
  useWatch,
  type Control,
  type FieldArrayPath,
  type FieldValues,
  type UseFormSetValue,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils/format";
import {
  getDocumentPreviewTotals,
  getLinePreviewTotal,
} from "@/features/shared/utils/document-calculations";
import type { DiscountType } from "@/features/shared/types/documents";

interface ItemOption {
  id: string;
  name: string;
  description?: string | null;
  salesPrice?: number | null;
  purchaseCost?: number | null;
}

interface AccountOption {
  id: string;
  name: string;
  code?: string | null;
}

interface TaxCodeOption {
  id: string;
  name: string;
  code?: string | null;
  calculationMode?: string | null;
  isExempt?: boolean;
  effectiveRatePercent?: number;
}

interface LineItemsEditorProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldArrayPath<TFieldValues>;
  itemOptions: ItemOption[];
  accountOptions?: AccountOption[];
  taxCodeOptions?: TaxCodeOption[];
  mode: "sales" | "purchase";
  currencyCode?: string | null;
  setValue?: UseFormSetValue<TFieldValues>;
  docDiscountType?: DiscountType | null;
  docDiscountValue?: number | null;
}

const discountOptions: DiscountType[] = ["amount", "percentage"];

export function LineItemsEditor<TFieldValues extends FieldValues>({
  control,
  name,
  itemOptions,
  accountOptions = [],
  taxCodeOptions = [],
  mode,
  currencyCode,
  setValue,
  docDiscountType,
  docDiscountValue,
}: LineItemsEditorProps<TFieldValues>) {
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });
  const watchedLines = (useWatch({
    control,
    name: name as never,
  }) as Array<{
    itemId?: string;
    description?: string;
    quantity?: number;
    unitPrice?: number;
    unitCost?: number;
    discountType?: DiscountType;
    discountValue?: number;
    taxCodeId?: string;
    taxRate?: number;
    expenseAccountId?: string;
  }>) ?? [];

  const taxCodeMap = useMemo(() => {
    const map = new Map<string, TaxCodeOption>();
    for (const tc of taxCodeOptions) {
      map.set(tc.id, tc);
    }
    return map;
  }, [taxCodeOptions]);

  const totals = useMemo(() => {
    return getDocumentPreviewTotals(
      watchedLines.map((line) => ({
        itemId: line.itemId,
        description: line.description ?? "",
        quantity: Number(line.quantity ?? 0),
        unitPrice: Number(line.unitPrice ?? 0),
        unitCost: Number(line.unitCost ?? 0),
        discountType: line.discountType,
        discountValue: Number(line.discountValue ?? 0),
        taxCodeId: line.taxCodeId,
        taxRate: Number(line.taxRate ?? 0),
        expenseAccountId: line.expenseAccountId,
      })),
      { discountType: docDiscountType, discountValue: docDiscountValue },
    );
  }, [watchedLines, docDiscountType, docDiscountValue]);

  const handleItemChange = useCallback(
    (index: number, itemId: string) => {
      if (!setValue) return;
      const selectedItem = itemOptions.find((item) => item.id === itemId);
      if (selectedItem) {
        const priceField =
          mode === "sales" ? "unitPrice" : "unitCost";
        const price =
          mode === "sales"
            ? selectedItem.salesPrice
            : selectedItem.purchaseCost;

        setValue(
          `${name}.${index}.${priceField}` as never,
          (price ?? 0) as never,
        );
        if (selectedItem.description) {
          setValue(
            `${name}.${index}.description` as never,
            selectedItem.description as never,
          );
        }
      }
    },
    [itemOptions, mode, name, setValue],
  );

  const handleTaxCodeChange = useCallback(
    (index: number, taxCodeId: string) => {
      if (!setValue) return;
      setValue(`${name}.${index}.taxCodeId` as never, taxCodeId as never);

      const taxCode = taxCodeMap.get(taxCodeId);
      if (taxCode && taxCode.effectiveRatePercent != null) {
        setValue(
          `${name}.${index}.taxRate` as never,
          taxCode.effectiveRatePercent as never,
        );
      } else {
        setValue(`${name}.${index}.taxRate` as never, 0 as never);
      }
    },
    [name, setValue, taxCodeMap],
  );

  const priceLabel = mode === "sales" ? "Rate" : "Unit Cost";
  const currency = currencyCode ?? "USD";
  const colCount = mode === "purchase" ? 10 : 9;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-[hsl(var(--secondary)/0.4)]">
              <th className="w-8 px-2 py-3" />
              <th className="min-w-[40px] px-2 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                #
              </th>
              <th className="min-w-[200px] px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Product / Service
              </th>
              <th className="min-w-[200px] px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Description
              </th>
              <th className="w-[100px] px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Qty
              </th>
              <th className="w-[120px] px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {priceLabel}
              </th>
              <th className="w-[140px] px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Discount
              </th>
              {mode === "purchase" ? (
                <th className="min-w-[180px] px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Account
                </th>
              ) : null}
              <th className="w-[150px] px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tax
              </th>
              <th className="w-[110px] px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Amount
              </th>
              <th className="w-10 px-2 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {fields.map((field, index) => {
              const lineTotal = getLinePreviewTotal({
                description: watchedLines[index]?.description ?? "",
                quantity: Number(watchedLines[index]?.quantity ?? 0),
                unitPrice: Number(watchedLines[index]?.unitPrice ?? 0),
                unitCost: Number(watchedLines[index]?.unitCost ?? 0),
                discountType: watchedLines[index]?.discountType,
                discountValue: Number(
                  watchedLines[index]?.discountValue ?? 0,
                ),
                taxRate: Number(watchedLines[index]?.taxRate ?? 0),
              });

              return (
                <tr
                  className="group transition-colors hover:bg-accent/30"
                  key={field.id}
                >
                  <td className="px-2 py-2.5 text-center">
                    <GripVertical className="mx-auto h-4 w-4 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
                  </td>

                  <td className="px-2 py-2.5 text-center text-xs font-medium text-muted-foreground">
                    {index + 1}
                  </td>

                  {/* Item select */}
                  <td className="px-3 py-2.5">
                    <Controller
                      control={control}
                      name={`${name}.${index}.itemId` as never}
                      render={({ field: inputField }) => (
                        <Select
                          className="h-9 rounded-lg border-transparent bg-transparent text-sm transition-all focus:border-primary focus:bg-white hover:bg-secondary/60"
                          onChange={(event) => {
                            inputField.onChange(event.target.value);
                            handleItemChange(index, event.target.value);
                          }}
                          value={
                            (inputField.value as string | undefined) ?? ""
                          }
                        >
                          <option value="">Select item...</option>
                          {itemOptions.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </Select>
                      )}
                    />
                  </td>

                  {/* Description */}
                  <td className="px-3 py-2.5">
                    <Controller
                      control={control}
                      name={`${name}.${index}.description` as never}
                      render={({ field: inputField }) => (
                        <Input
                          {...inputField}
                          className="h-9 rounded-lg border-transparent bg-transparent text-sm transition-all focus:border-primary focus:bg-white hover:bg-secondary/60"
                          placeholder="Enter description"
                          value={(inputField.value as string) ?? ""}
                        />
                      )}
                    />
                  </td>

                  {/* Quantity */}
                  <td className="px-3 py-2.5">
                    <Controller
                      control={control}
                      name={`${name}.${index}.quantity` as never}
                      render={({ field: inputField }) => (
                        <Input
                          className="h-9 rounded-lg border-transparent bg-transparent text-center text-sm transition-all focus:border-primary focus:bg-white hover:bg-secondary/60"
                          min="0"
                          onBlur={inputField.onBlur}
                          onChange={(e) => {
                            const val = e.target.value;
                            inputField.onChange(
                              val === "" ? "" : Number(val),
                            );
                          }}
                          ref={inputField.ref}
                          step="any"
                          type="number"
                          value={
                            inputField.value === undefined ||
                            inputField.value === null
                              ? ""
                              : String(inputField.value)
                          }
                        />
                      )}
                    />
                  </td>

                  {/* Unit Price / Unit Cost */}
                  <td className="px-3 py-2.5">
                    <Controller
                      control={control}
                      name={
                        `${name}.${index}.${mode === "sales" ? "unitPrice" : "unitCost"}` as never
                      }
                      render={({ field: inputField }) => (
                        <Input
                          className="h-9 rounded-lg border-transparent bg-transparent text-right text-sm transition-all focus:border-primary focus:bg-white hover:bg-secondary/60"
                          min="0"
                          onBlur={inputField.onBlur}
                          onChange={(e) => {
                            const val = e.target.value;
                            inputField.onChange(
                              val === "" ? "" : Number(val),
                            );
                          }}
                          ref={inputField.ref}
                          step="any"
                          type="number"
                          value={
                            inputField.value === undefined ||
                            inputField.value === null
                              ? ""
                              : String(inputField.value)
                          }
                        />
                      )}
                    />
                  </td>

                  {/* Discount (collapsed) */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      <Controller
                        control={control}
                        name={
                          `${name}.${index}.discountType` as never
                        }
                        render={({ field: inputField }) => (
                          <Select
                            className="h-9 w-[70px] rounded-lg border-transparent bg-transparent text-xs transition-all focus:border-primary focus:bg-white hover:bg-secondary/60"
                            onChange={(event) =>
                              inputField.onChange(event.target.value)
                            }
                            value={
                              (inputField.value as string | undefined) ??
                              ""
                            }
                          >
                            <option value="">—</option>
                            {discountOptions.map((option) => (
                              <option key={option} value={option}>
                                {option === "amount" ? "$" : "%"}
                              </option>
                            ))}
                          </Select>
                        )}
                      />
                      <Controller
                        control={control}
                        name={
                          `${name}.${index}.discountValue` as never
                        }
                        render={({ field: inputField }) => (
                          <Input
                            className="h-9 w-[60px] rounded-lg border-transparent bg-transparent text-right text-sm transition-all focus:border-primary focus:bg-white hover:bg-secondary/60"
                            min="0"
                            onBlur={inputField.onBlur}
                            onChange={(e) => {
                              const val = e.target.value;
                              inputField.onChange(
                                val === "" ? "" : Number(val),
                              );
                            }}
                            ref={inputField.ref}
                            step="any"
                            type="number"
                            value={
                              inputField.value === undefined ||
                              inputField.value === null
                                ? ""
                                : String(inputField.value)
                            }
                          />
                        )}
                      />
                    </div>
                  </td>

                  {/* Expense account (purchase mode only) */}
                  {mode === "purchase" ? (
                    <td className="px-3 py-2.5">
                      <Controller
                        control={control}
                        name={
                          `${name}.${index}.expenseAccountId` as never
                        }
                        render={({ field: inputField }) => (
                          <Select
                            className="h-9 rounded-lg border-transparent bg-transparent text-sm transition-all focus:border-primary focus:bg-white hover:bg-secondary/60"
                            onChange={(event) =>
                              inputField.onChange(event.target.value)
                            }
                            value={
                              (inputField.value as string | undefined) ??
                              ""
                            }
                          >
                            <option value="">Select account</option>
                            {accountOptions.map((account) => (
                              <option key={account.id} value={account.id}>
                                {(account.code
                                  ? `${account.code} - `
                                  : "") + account.name}
                              </option>
                            ))}
                          </Select>
                        )}
                      />
                    </td>
                  ) : null}

                  {/* Tax code selector */}
                  <td className="px-3 py-2.5">
                    <Controller
                      control={control}
                      name={`${name}.${index}.taxCodeId` as never}
                      render={({ field: inputField }) => (
                        <Select
                          className="h-9 rounded-lg border-transparent bg-transparent text-sm transition-all focus:border-primary focus:bg-white hover:bg-secondary/60"
                          onChange={(event) => {
                            inputField.onChange(event.target.value);
                            handleTaxCodeChange(index, event.target.value);
                          }}
                          value={
                            (inputField.value as string | undefined) ?? ""
                          }
                        >
                          <option value="">No Tax</option>
                          {taxCodeOptions.map((tc) => (
                            <option key={tc.id} value={tc.id}>
                              {tc.code
                                ? `${tc.code} (${tc.effectiveRatePercent ?? 0}%)`
                                : `${tc.name} (${tc.effectiveRatePercent ?? 0}%)`}
                            </option>
                          ))}
                        </Select>
                      )}
                    />
                  </td>

                  {/* Line amount */}
                  <td className="px-3 py-2.5 text-right">
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(lineTotal, currency)}
                    </span>
                  </td>

                  {/* Delete */}
                  <td className="px-2 py-2.5 text-center">
                    {fields.length > 1 ? (
                      <button
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/50 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                        onClick={() => remove(index)}
                        title="Remove line"
                        type="button"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Totals footer */}
          <tfoot>
            <tr className="border-t-2 border-border bg-[hsl(var(--secondary)/0.3)]">
              <td
                className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                colSpan={colCount}
              >
                Subtotal
              </td>
              <td className="px-3 py-3 text-right text-sm font-bold text-foreground">
                {formatCurrency(totals.subtotal + totals.discountTotal, currency)}
              </td>
              <td />
            </tr>
            {totals.discountTotal > 0 ? (
              <tr className="bg-[hsl(var(--secondary)/0.3)]">
                <td
                  className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  colSpan={colCount}
                >
                  Discount
                </td>
                <td className="px-3 py-2 text-right text-sm font-semibold text-destructive">
                  -{formatCurrency(totals.discountTotal, currency)}
                </td>
                <td />
              </tr>
            ) : null}
            <tr className="bg-[hsl(var(--secondary)/0.3)]">
              <td
                className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                colSpan={colCount}
              >
                Tax
              </td>
              <td className="px-3 py-2 text-right text-sm font-semibold text-foreground">
                {formatCurrency(totals.taxTotal, currency)}
              </td>
              <td />
            </tr>
            <tr className="bg-[hsl(var(--primary)/0.06)]">
              <td
                className="px-3 py-3 text-right text-sm font-bold uppercase tracking-wider text-foreground"
                colSpan={colCount}
              >
                Total
              </td>
              <td className="px-3 py-3 text-right text-base font-bold text-primary">
                {formatCurrency(totals.total, currency)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Add line button */}
      <div className="flex items-center gap-3">
        <Button
          className="gap-2 rounded-lg"
          onClick={() =>
            append({
              itemId: "",
              description: "",
              quantity: 1,
              unitPrice: mode === "sales" ? 0 : undefined,
              unitCost: mode === "purchase" ? 0 : undefined,
              discountType: undefined,
              discountValue: undefined,
              taxCodeId: "",
              taxRate: undefined,
              expenseAccountId: "",
            } as never)
          }
          size="sm"
          type="button"
          variant="secondary"
        >
          <Plus className="h-4 w-4" />
          Add a line
        </Button>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Package className="h-3.5 w-3.5" />
          {fields.length} {fields.length === 1 ? "item" : "items"}
        </span>
      </div>
    </div>
  );
}

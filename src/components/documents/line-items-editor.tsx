import { useCallback, useMemo, useState } from "react";
import { Plus, Trash2, GripVertical, Package } from "lucide-react";
import {
  Controller,
  useFieldArray,
  useWatch,
  type Control,
  type FieldArrayPath,
  type FieldErrors,
  type FieldValues,
  type UseFormSetValue,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ItemSelect } from "@/components/documents/item-select";
import { formatCurrency } from "@/lib/utils/format";
import {
  exclToIncl,
  getDocumentPreviewTotals,
  getLineDiscountedAmount,
  getLinePreviewTotal,
  inclToExcl,
  unitAmountFromInclusiveLineTotal,
} from "@/features/shared/utils/document-calculations";
import { convertBasePriceToDocumentPrice } from "@/features/companies/utils/company-currency";
import type { DiscountType } from "@/features/shared/types/documents";
import { toDecimalString, toNumber } from "@/features/shared/utils/decimal-string";
import { toDocumentLinePreview } from "@/features/shared/utils/api-payload";

interface ItemOption {
  id: string;
  name: string;
  description?: string | null;
  salesPrice?: string | null;
  purchaseCost?: string | null;
  preferredVendorId?: string | null;
  unitName?: string | null;
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
  baseCurrencyCode?: string | null;
  exchangeRate?: string | null;
  setValue?: UseFormSetValue<TFieldValues>;
  docDiscountType?: DiscountType | null;
  docDiscountValue?: number | null;
  /**
   * When false (default), the per-line GL account picker is hidden so that
   * non-accountant users are not asked to map every line to an account.
   * The backend falls back to the company's default accounts in that case.
   */
  showAccountColumn?: boolean;
  /**
   * When set (e.g. the vendorId on a bill), items with preferredVendorId
   * matching this value are sorted to the top of the item dropdown and
   * labelled "(preferred)".
   */
  preferredVendorId?: string;
  errors?: FieldErrors;
  /** Opens create-item flow for the given line index. */
  onCreateItemForLine?: (lineIndex: number) => void;
  createItemLabel?: string;
}

const discountOptions: DiscountType[] = ["FIXED", "PERCENTAGE"];

export function LineItemsEditor<TFieldValues extends FieldValues>({
  control,
  name,
  itemOptions,
  accountOptions = [],
  taxCodeOptions = [],
  mode,
  currencyCode,
  baseCurrencyCode,
  exchangeRate,
  setValue,
  docDiscountType,
  docDiscountValue,
  showAccountColumn = false,
  preferredVendorId,
  errors,
  onCreateItemForLine,
  createItemLabel = "Create new item…",
}: LineItemsEditorProps<TFieldValues>) {
  const accountColumnVisible = mode === "purchase" && showAccountColumn;
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });
  const [inclDraftByLine, setInclDraftByLine] = useState<Record<string, string>>({});
  const [editingInclLineId, setEditingInclLineId] = useState<string | null>(null);
  const [unitInclDraftByLine, setUnitInclDraftByLine] = useState<Record<string, string>>({});
  const [editingUnitInclLineId, setEditingUnitInclLineId] = useState<string | null>(null);

  // Sort: preferred items float to top when a vendor is selected
  const sortedItemOptions = useMemo(() => {
    if (!preferredVendorId) return itemOptions;
    const preferred = itemOptions.filter((item) => item.preferredVendorId === preferredVendorId);
    const rest = itemOptions.filter((item) => item.preferredVendorId !== preferredVendorId);
    return [...preferred, ...rest];
  }, [itemOptions, preferredVendorId]);

  const itemSelectOptions = useMemo(
    () =>
      sortedItemOptions.map((item) => ({
        id: item.id,
        label: item.name,
        secondary:
          preferredVendorId && item.preferredVendorId === preferredVendorId
            ? "preferred"
            : undefined,
      })),
    [sortedItemOptions, preferredVendorId],
  );

  const watchedLines = (useWatch({
    control,
    name: name as never,
  }) as Array<{
    itemId?: string;
    description?: string;
    quantity?: string;
    unitPrice?: string;
    unitCost?: string;
    discountType?: DiscountType;
    discountValue?: string;
    taxCodeId?: string;
    taxRate?: string;
    expenseAccountId?: string;
    unitName?: string;
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
      watchedLines.map((line) => toDocumentLinePreview(line)),
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
        const basePrice =
          mode === "sales"
            ? Number(selectedItem.salesPrice ?? "0")
            : Number(selectedItem.purchaseCost ?? "0");
        const price = convertBasePriceToDocumentPrice(
          basePrice,
          exchangeRate ?? undefined,
          currencyCode ?? baseCurrencyCode ?? "USD",
          baseCurrencyCode ?? currencyCode ?? "USD",
        );

        setValue(
          `${name}.${index}.${priceField}` as never,
          toDecimalString(price) as never,
          { shouldDirty: true, shouldValidate: true },
        );
        setValue(`${name}.${index}.itemName` as never, selectedItem.name as never, {
          shouldDirty: true,
        });
        setValue(
          `${name}.${index}.unitName` as never,
          (selectedItem.unitName ?? "") as never,
          { shouldDirty: true },
        );
        if (selectedItem.description) {
          setValue(
            `${name}.${index}.description` as never,
            selectedItem.description as never,
            { shouldDirty: true },
          );
        }
      }
    },
    [baseCurrencyCode, currencyCode, exchangeRate, itemOptions, mode, name, setValue],
  );

  const handleTaxCodeChange = useCallback(
    (index: number, taxCodeId: string) => {
      if (!setValue) return;
      setValue(`${name}.${index}.taxCodeId` as never, taxCodeId as never);

      const taxCode = taxCodeMap.get(taxCodeId);
      const isExempt =
        Boolean(taxCode?.isExempt) || taxCode?.calculationMode === "EXEMPT";
      if (taxCode && !isExempt && taxCode.effectiveRatePercent != null) {
        setValue(
          `${name}.${index}.taxRate` as never,
          toDecimalString(taxCode.effectiveRatePercent) as never,
        );
      } else {
        setValue(`${name}.${index}.taxRate` as never, "0" as never);
      }
    },
    [name, setValue, taxCodeMap],
  );

  const handleInclusiveAmountChange = useCallback(
    (index: number, fieldId: string, rawValue: string) => {
      setInclDraftByLine((current) => ({ ...current, [fieldId]: rawValue }));
      if (!setValue) return;
      const parsed = Number(rawValue);
      if (!Number.isFinite(parsed) || rawValue.trim() === "") return;

      const line = watchedLines[index] ?? { description: "" };
      const previewLine = toDocumentLinePreview(line);
      const unit = unitAmountFromInclusiveLineTotal(previewLine, parsed);
      const priceField = mode === "sales" ? "unitPrice" : "unitCost";
      setValue(
        `${name}.${index}.${priceField}` as never,
        toDecimalString(unit) as never,
        { shouldDirty: true, shouldValidate: true },
      );
    },
    [mode, name, setValue, watchedLines],
  );

  const resolveLineTaxRate = useCallback(
    (line: { taxCodeId?: string; taxRate?: string }) => {
      const fromField = toNumber(line.taxRate);
      if (fromField > 0) return fromField;
      const taxCode = line.taxCodeId ? taxCodeMap.get(line.taxCodeId) : undefined;
      if (taxCode?.isExempt) return 0;
      return taxCode?.effectiveRatePercent ?? 0;
    },
    [taxCodeMap],
  );

  const handleUnitInclusiveChange = useCallback(
    (index: number, fieldId: string, rawValue: string) => {
      setUnitInclDraftByLine((current) => ({ ...current, [fieldId]: rawValue }));
      if (!setValue) return;
      const parsed = Number(rawValue);
      if (!Number.isFinite(parsed) || rawValue.trim() === "") return;

      const line = watchedLines[index] ?? {};
      const rate = resolveLineTaxRate(line);
      const unitEx = inclToExcl(parsed, rate);
      setValue(
        `${name}.${index}.unitCost` as never,
        toDecimalString(unitEx) as never,
        { shouldDirty: true, shouldValidate: true },
      );
    },
    [name, resolveLineTaxRate, setValue, watchedLines],
  );

  const priceLabel = mode === "sales" ? "Rate" : "Rate (ex-tax)";
  const currency = currencyCode ?? "USD";
  // Columns before the primary amount column (sales: Amount incl; purchase: Line incl).
  const colCount =
    (accountColumnVisible ? 10 : 9) + (mode === "purchase" ? 2 : 0);

  return (
    <div className="w-full min-w-0 space-y-3">
      <div className="w-full min-w-0 overflow-x-auto rounded-xl border border-border bg-white shadow-sm">
        <table className="w-full min-w-full table-auto text-left text-sm">
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
              {mode === "purchase" ? (
                <th className="w-[120px] px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Rate (incl. tax)
                </th>
              ) : null}
              <th className="w-[140px] px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Discount
              </th>
              {accountColumnVisible ? (
                <th className="min-w-[180px] px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Account
                </th>
              ) : null}
              <th className="w-[150px] px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tax
              </th>
              {mode === "purchase" ? (
                <th className="w-[120px] px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Line (ex-tax)
                </th>
              ) : null}
              <th className="w-[120px] px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {mode === "purchase" ? "Line (incl. tax)" : "Amount (incl. tax)"}
              </th>
              <th className="w-10 px-2 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {fields.map((field, index) => {
              const lineErrors = Array.isArray(errors?.lines)
                ? (errors.lines[index] as FieldErrors | undefined)
                : undefined;
              const previewLine = toDocumentLinePreview(
                watchedLines[index] ?? { description: "" },
              );
              const lineTotal = getLinePreviewTotal(previewLine);
              const lineExTotal = getLineDiscountedAmount(previewLine);
              const line = watchedLines[index] ?? {};
              const unitSuffix =
                line.unitName ||
                itemOptions.find((item) => item.id === line.itemId)?.unitName ||
                null;
              const taxRatePercent = resolveLineTaxRate(line);
              const unitEx = toNumber(mode === "sales" ? line.unitPrice : line.unitCost);
              const unitIncl = exclToIncl(unitEx, taxRatePercent);

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
                        <ItemSelect
                          createLabel={createItemLabel}
                          onChange={(next) => {
                            inputField.onChange(next);
                            handleItemChange(index, next);
                          }}
                          onCreateNew={
                            onCreateItemForLine
                              ? () => onCreateItemForLine(index)
                              : undefined
                          }
                          options={itemSelectOptions}
                          placeholder="Select item..."
                          value={(inputField.value as string | undefined) ?? ""}
                        />
                      )}
                    />
                  </td>

                  {/* Description */}
                  <td className="px-3 py-2.5">
                    <Controller
                      control={control}
                      name={`${name}.${index}.description` as never}
                      render={({ field: inputField }) => (
                        <div className="space-y-1">
                          <Input
                            {...inputField}
                            className="h-9 rounded-lg border border-border bg-white text-sm transition-all focus:border-primary"
                            placeholder="Enter description"
                            value={(inputField.value as string) ?? ""}
                          />
                          {lineErrors?.description?.message ? (
                            <p className="text-xs text-destructive">
                              {String(lineErrors.description.message)}
                            </p>
                          ) : null}
                        </div>
                      )}
                    />
                  </td>

                  {/* Quantity */}
                  <td className="px-3 py-2.5">
                    <Controller
                      control={control}
                      name={`${name}.${index}.quantity` as never}
                      render={({ field: inputField }) => (
                        <div className="space-y-1">
                          <Input
                            className="h-9 rounded-lg border border-border bg-white text-center text-sm transition-all focus:border-primary"
                            min="0"
                            onBlur={inputField.onBlur}
                            onChange={(e) => {
                              inputField.onChange(e.target.value);
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
                          {lineErrors?.quantity?.message ? (
                            <p className="text-xs text-destructive">
                              {String(lineErrors.quantity.message)}
                            </p>
                          ) : null}
                        </div>
                      )}
                    />
                  </td>

                  {/* Unit Price / Unit Cost (ex-tax) */}
                  <td className="px-3 py-2.5">
                    <Controller
                      control={control}
                      name={
                        `${name}.${index}.${mode === "sales" ? "unitPrice" : "unitCost"}` as never
                      }
                      render={({ field: inputField }) => (
                        <div className="space-y-0.5">
                          <Input
                            className="h-9 rounded-lg border border-border bg-white text-right text-sm transition-all focus:border-primary"
                            min="0"
                            onBlur={inputField.onBlur}
                            onChange={(e) => {
                              inputField.onChange(e.target.value);
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
                          {mode === "purchase" && unitSuffix ? (
                            <p className="text-[10px] text-muted-foreground">/ {unitSuffix}</p>
                          ) : null}
                        </div>
                      )}
                    />
                  </td>

                  {mode === "purchase" ? (
                    <td className="px-3 py-2.5">
                      <div className="space-y-0.5">
                        <Input
                          className="h-9 rounded-lg border border-border bg-white text-right text-sm transition-all focus:border-primary"
                          min="0"
                          onBlur={() => {
                            setEditingUnitInclLineId(null);
                            setUnitInclDraftByLine((current) => {
                              const next = { ...current };
                              delete next[field.id];
                              return next;
                            });
                          }}
                          onChange={(event) =>
                            handleUnitInclusiveChange(index, field.id, event.target.value)
                          }
                          onFocus={() => {
                            setEditingUnitInclLineId(field.id);
                            setUnitInclDraftByLine((current) => ({
                              ...current,
                              [field.id]: String(Number(unitIncl.toFixed(4))),
                            }));
                          }}
                          step="any"
                          type="number"
                          value={
                            editingUnitInclLineId === field.id &&
                            unitInclDraftByLine[field.id] !== undefined
                              ? unitInclDraftByLine[field.id]
                              : unitIncl
                                ? String(Number(unitIncl.toFixed(4)))
                                : ""
                          }
                        />
                        {unitSuffix ? (
                          <p className="text-[10px] text-muted-foreground">/ {unitSuffix}</p>
                        ) : null}
                      </div>
                    </td>
                  ) : null}

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
                            className="h-9 w-[70px] rounded-lg border border-border bg-white text-xs transition-all focus:border-primary"
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
                                {option === "FIXED" ? "$" : "%"}
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
                            className="h-9 w-[60px] rounded-lg border border-border bg-white text-right text-sm transition-all focus:border-primary"
                            min="0"
                            onBlur={inputField.onBlur}
                            onChange={(e) => {
                              inputField.onChange(e.target.value);
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

                  {/* Expense account (purchase mode, advanced toggle only) */}
                  {accountColumnVisible ? (
                    <td className="px-3 py-2.5">
                      <Controller
                        control={control}
                        name={
                          `${name}.${index}.expenseAccountId` as never
                        }
                        render={({ field: inputField }) => (
                          <Select
                            className="h-9 rounded-lg border border-border bg-white text-sm transition-all focus:border-primary"
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
                          className="h-9 rounded-lg border border-border bg-white text-sm transition-all focus:border-primary"
                          onChange={(event) => {
                            inputField.onChange(event.target.value);
                            handleTaxCodeChange(index, event.target.value);
                          }}
                          value={
                            (inputField.value as string | undefined) ?? ""
                          }
                        >
                          <option value="">No tax</option>
                          {taxCodeOptions.map((tc) => {
                            const labelName = tc.name || tc.code || "Tax";
                            const rate = tc.effectiveRatePercent ?? 0;
                            const label =
                              tc.isExempt || tc.calculationMode === "EXEMPT"
                                ? labelName
                                : `${labelName} (${rate}%)`;
                            return (
                              <option key={tc.id} value={tc.id}>
                                {label}
                              </option>
                            );
                          })}
                        </Select>
                      )}
                    />
                  </td>

                  {/* Line totals */}
                  {mode === "purchase" ? (
                    <td className="px-3 py-2.5 text-right text-sm font-medium text-foreground">
                      {lineExTotal
                        ? formatCurrency(lineExTotal, currency)
                        : "—"}
                    </td>
                  ) : null}
                  <td className="px-3 py-2.5 text-right">
                    {mode === "purchase" ? (
                      <span className="text-sm font-semibold text-foreground">
                        {lineTotal ? formatCurrency(lineTotal, currency) : "—"}
                      </span>
                    ) : (
                      <Input
                        className="h-9 rounded-lg border border-border bg-white text-right text-sm font-semibold transition-all focus:border-primary"
                        min="0"
                        onBlur={() => {
                          setEditingInclLineId(null);
                          setInclDraftByLine((current) => {
                            const next = { ...current };
                            delete next[field.id];
                            return next;
                          });
                        }}
                        onChange={(event) =>
                          handleInclusiveAmountChange(index, field.id, event.target.value)
                        }
                        onFocus={() => {
                          setEditingInclLineId(field.id);
                          setInclDraftByLine((current) => ({
                            ...current,
                            [field.id]: String(Number(lineTotal.toFixed(4))),
                          }));
                        }}
                        step="any"
                        type="number"
                        value={
                          editingInclLineId === field.id &&
                          inclDraftByLine[field.id] !== undefined
                            ? inclDraftByLine[field.id]
                            : lineTotal
                              ? String(Number(lineTotal.toFixed(4)))
                              : ""
                        }
                      />
                    )}
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
              quantity: "1",
              unitPrice: mode === "sales" ? "" : undefined,
              unitCost: mode === "purchase" ? "" : undefined,
              discountType: undefined,
              discountValue: "",
              taxCodeId: "",
              taxRate: "",
              itemName: "",
              unitName: "",
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

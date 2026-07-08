import { useEffect } from "react";
import { Controller, type Control, type FieldErrors, type FieldValues, type Path, type PathValue, type UseFormRegister, type UseFormSetValue } from "react-hook-form";
import { CurrencySelect } from "@/components/shared/currency-select";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { useLatestExchangeRate } from "@/features/exchange-rates/hooks/use-latest-exchange-rate";
import { getCompanyBaseCurrency, exchangeRateTableToDocumentRate } from "@/features/companies/utils/company-currency";
import type { Company } from "@/features/companies/types/company.types";

interface DocumentCurrencyFieldsProps<TFieldValues extends FieldValues = FieldValues> {
  company: Company | null | undefined;
  companyId?: string;
  control: Control<TFieldValues>;
  register: UseFormRegister<TFieldValues>;
  setValue: UseFormSetValue<TFieldValues>;
  errors?: FieldErrors<TFieldValues>;
  documentCurrencyCode?: string;
  exchangeRateValue?: string;
  layout?: "grid" | "stack";
  currencyLocked?: boolean;
}

export const DocumentCurrencyFields = <TFieldValues extends FieldValues>({
  company,
  companyId,
  control,
  register,
  setValue,
  errors,
  documentCurrencyCode,
  exchangeRateValue,
  layout = "grid",
  currencyLocked = false,
}: DocumentCurrencyFieldsProps<TFieldValues>) => {
  const currencyCodeField = "currencyCode" as Path<TFieldValues>;
  const exchangeRateField = "exchangeRate" as Path<TFieldValues>;

  const baseCurrency = getCompanyBaseCurrency(company);
  const docCurrency = (documentCurrencyCode || baseCurrency).toUpperCase();
  const needsExchangeRate = docCurrency !== baseCurrency.toUpperCase();

  const latestRateQuery = useLatestExchangeRate(
    companyId,
    needsExchangeRate ? docCurrency : undefined,
    needsExchangeRate && !exchangeRateValue,
  );

  useEffect(() => {
    if (!needsExchangeRate) {
      setValue(exchangeRateField, "" as PathValue<TFieldValues, typeof exchangeRateField>, {
        shouldDirty: false,
      });
      return;
    }
    if (exchangeRateValue || !latestRateQuery.data?.rate) {
      return;
    }
    setValue(
      exchangeRateField,
      exchangeRateTableToDocumentRate(latestRateQuery.data.rate) as PathValue<
        TFieldValues,
        typeof exchangeRateField
      >,
      { shouldDirty: false },
    );
  }, [exchangeRateValue, latestRateQuery.data?.rate, needsExchangeRate, setValue]);

  const currencyField = currencyLocked ? (
    <FormField label="Currency">
      <p className="text-sm font-medium text-foreground">{docCurrency}</p>
    </FormField>
  ) : (
    <FormField error={errors?.currencyCode?.message as string | undefined} label="Currency">
      <Controller
        control={control}
        name={currencyCodeField}
        render={({ field }) => (
          <CurrencySelect
            name={field.name}
            onBlur={field.onBlur}
            onChange={field.onChange}
            value={field.value}
          />
        )}
      />
    </FormField>
  );

  const rateField = needsExchangeRate ? (
    <FormField
      error={errors?.exchangeRate?.message as string | undefined}
      label={`1 ${docCurrency} = ___ ${baseCurrency}`}
    >
      <Input
        inputMode="decimal"
        placeholder={latestRateQuery.isLoading ? "Loading suggested rate..." : "Enter exchange rate"}
        step="0.00000001"
        type="number"
        {...register(exchangeRateField)}
      />
    </FormField>
  ) : null;

  if (layout === "stack") {
    return (
      <div className="space-y-3">
        {currencyField}
        {rateField}
      </div>
    );
  }

  return (
    <>
      {currencyField}
      {rateField}
    </>
  );
};

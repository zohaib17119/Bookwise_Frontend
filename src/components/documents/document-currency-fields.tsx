import { useEffect } from "react";
import { Controller, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from "react-hook-form";
import { CurrencySelect } from "@/components/shared/currency-select";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { useLatestExchangeRate } from "@/features/exchange-rates/hooks/use-latest-exchange-rate";
import { getCompanyBaseCurrency } from "@/features/companies/utils/company-currency";
import type { Company } from "@/features/companies/types/company.types";

interface DocumentCurrencyFieldsProps {
  company: Company | null | undefined;
  companyId?: string;
  control: Control<any>;
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  errors?: FieldErrors<any>;
  documentCurrencyCode?: string;
  exchangeRateValue?: string;
  layout?: "grid" | "stack";
}

export function DocumentCurrencyFields({
  company,
  companyId,
  control,
  register,
  setValue,
  errors,
  documentCurrencyCode,
  exchangeRateValue,
  layout = "grid",
}: DocumentCurrencyFieldsProps) {
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
      setValue("exchangeRate", "", { shouldDirty: false });
      return;
    }
    if (exchangeRateValue || !latestRateQuery.data?.rate) {
      return;
    }
    setValue("exchangeRate", latestRateQuery.data.rate, { shouldDirty: false });
  }, [exchangeRateValue, latestRateQuery.data?.rate, needsExchangeRate, setValue]);

  const currencyField = (
    <FormField error={errors?.currencyCode?.message as string | undefined} label="Currency">
      <Controller
        control={control}
        name="currencyCode"
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
        {...register("exchangeRate")}
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
}

import { useEffect, useRef } from "react";
import type { UseFormReturn } from "react-hook-form";
import { getCompanyBaseCurrency } from "@/features/companies/utils/company-currency";
import type { Company } from "@/features/companies/types/company.types";

type CounterpartyWithCurrency = {
  id: string;
  currencyCode?: string | null;
};

export function useCounterpartyCurrencyDefault({
  form,
  counterpartyId,
  counterparties,
  company,
  mode,
}: {
  form: UseFormReturn<any>;
  counterpartyId: string | undefined;
  counterparties: CounterpartyWithCurrency[];
  company: Company | null | undefined;
  mode: "create" | "edit";
}) {
  const prevCounterpartyRef = useRef<string | undefined>(undefined);
  const baseCurrency = getCompanyBaseCurrency(company);

  useEffect(() => {
    if (!counterpartyId) {
      return;
    }

    const counterparty = counterparties.find((row) => row.id === counterpartyId);
    if (!counterparty) {
      return;
    }

    if (prevCounterpartyRef.current === undefined) {
      prevCounterpartyRef.current = counterpartyId;
      if (mode === "create") {
        form.setValue("currencyCode", counterparty.currencyCode ?? baseCurrency, {
          shouldDirty: true,
        });
        form.setValue("exchangeRate", "");
      }
      return;
    }

    if (prevCounterpartyRef.current === counterpartyId) {
      return;
    }

    prevCounterpartyRef.current = counterpartyId;
    form.setValue("currencyCode", counterparty.currencyCode ?? baseCurrency, {
      shouldDirty: true,
    });
    form.setValue("exchangeRate", "");
  }, [baseCurrency, counterparties, counterpartyId, form, mode]);
}

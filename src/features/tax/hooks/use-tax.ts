import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createTaxCode,
  createTaxRate,
  deleteTaxCode,
  deleteTaxRate,
  getTaxCodes,
  getTaxDetailReport,
  getTaxRates,
  getTaxSettings,
  getTaxSummaryReport,
  getWhtSummaryReport,
  getTaxBalances,
  getTaxPayments,
  createTaxPayment,
  payInvoiceSalesTax,
  settleInvoiceIncomeWht,
  claimBillPurchaseTax,
  settleBillIncomeWht,
  updateTaxCode,
  updateTaxRate,
  upsertTaxSettings,
} from "@/features/tax/api/tax.api";
import type {
  TaxCodePayload,
  TaxRatePayload,
  TaxSettingsPayload,
  TaxPaymentPayload,
} from "@/features/tax/types/tax.types";
import type { ReportFilterParams } from "@/features/reports/types/report.types";
import { queryClient } from "@/lib/query/query-client";

function invalidateTaxQueries(companyId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "tax-rates"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "tax-codes"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "tax-settings"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "tax-reports"] }),
  ]);
}

export function useTaxRates(companyId: string | undefined) {
  return useQuery({
    queryKey: ["companies", companyId, "tax-rates"],
    queryFn: () => getTaxRates(companyId!),
    enabled: Boolean(companyId),
  });
}

export function useTaxCodes(companyId: string | undefined) {
  return useQuery({
    queryKey: ["companies", companyId, "tax-codes"],
    queryFn: () => getTaxCodes(companyId!),
    enabled: Boolean(companyId),
  });
}

export function useTaxSettings(companyId: string | undefined) {
  return useQuery({
    queryKey: ["companies", companyId, "tax-settings"],
    queryFn: () => getTaxSettings(companyId!),
    enabled: Boolean(companyId),
  });
}

export function useCreateTaxRate(companyId: string | undefined) {
  return useMutation({
    mutationFn: (payload: TaxRatePayload) => createTaxRate(companyId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateTaxQueries(companyId);
    },
  });
}

export function useUpdateTaxRate(companyId: string | undefined, taxRateId: string | null) {
  return useMutation({
    mutationFn: (payload: TaxRatePayload) => updateTaxRate(companyId!, taxRateId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateTaxQueries(companyId);
    },
  });
}

export function useDeleteTaxRate(companyId: string | undefined) {
  return useMutation({
    mutationFn: (taxRateId: string) => deleteTaxRate(companyId!, taxRateId),
    onSuccess: async () => {
      if (companyId) await invalidateTaxQueries(companyId);
    },
  });
}

export function useCreateTaxCode(companyId: string | undefined) {
  return useMutation({
    mutationFn: (payload: TaxCodePayload) => createTaxCode(companyId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateTaxQueries(companyId);
    },
  });
}

export function useUpdateTaxCode(companyId: string | undefined, taxCodeId: string | null) {
  return useMutation({
    mutationFn: (payload: TaxCodePayload) => updateTaxCode(companyId!, taxCodeId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateTaxQueries(companyId);
    },
  });
}

export function useDeleteTaxCode(companyId: string | undefined) {
  return useMutation({
    mutationFn: (taxCodeId: string) => deleteTaxCode(companyId!, taxCodeId),
    onSuccess: async () => {
      if (companyId) await invalidateTaxQueries(companyId);
    },
  });
}

export function useUpsertTaxSettings(companyId: string | undefined) {
  return useMutation({
    mutationFn: (payload: TaxSettingsPayload) => upsertTaxSettings(companyId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateTaxQueries(companyId);
    },
  });
}

export function useTaxSummaryReport(companyId: string | undefined, params: ReportFilterParams) {
  return useQuery({
    queryKey: ["companies", companyId, "tax-reports", "summary", params],
    queryFn: () => getTaxSummaryReport(companyId!, params),
    enabled: Boolean(companyId),
  });
}

export function useTaxDetailReport(companyId: string | undefined, params: ReportFilterParams) {
  return useQuery({
    queryKey: ["companies", companyId, "tax-reports", "detail", params],
    queryFn: () => getTaxDetailReport(companyId!, params),
    enabled: Boolean(companyId),
  });
}

export function useWhtSummaryReport(companyId: string | undefined, params: ReportFilterParams) {
  return useQuery({
    queryKey: ["companies", companyId, "tax-reports", "wht-summary", params],
    queryFn: () => getWhtSummaryReport(companyId!, params),
    enabled: Boolean(companyId),
  });
}

export function useTaxBalances(companyId: string | undefined) {
  return useQuery({
    queryKey: ["companies", companyId, "tax-balances"],
    queryFn: () => getTaxBalances(companyId!),
    enabled: Boolean(companyId),
  });
}

export function useTaxPayments(companyId: string | undefined) {
  return useQuery({
    queryKey: ["companies", companyId, "tax-payments"],
    queryFn: () => getTaxPayments(companyId!),
    enabled: Boolean(companyId),
  });
}

export function useCreateTaxPayment(companyId: string | undefined) {
  return useMutation({
    mutationFn: (payload: TaxPaymentPayload) => createTaxPayment(companyId!, payload),
    onSuccess: async () => {
      if (!companyId) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["companies", companyId, "tax-balances"] }),
        queryClient.invalidateQueries({ queryKey: ["companies", companyId, "tax-payments"] }),
        queryClient.invalidateQueries({ queryKey: ["companies", companyId, "dashboard"] }),
      ]);
    },
  });
}

async function invalidateAuthorityTax(companyId: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "tax-balances"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "tax-payments"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "tax-settings"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "dashboard"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "invoices"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "bills"] }),
  ]);
}

export function usePayInvoiceSalesTax(companyId: string | undefined) {
  return useMutation({
    mutationFn: (args: {
      invoiceId: string;
      paymentDate: string;
      bankAccountId?: string;
      carryForwardMaxPercent?: string;
    }) =>
      payInvoiceSalesTax(companyId!, args.invoiceId, {
        paymentDate: args.paymentDate,
        bankAccountId: args.bankAccountId,
        carryForwardMaxPercent: args.carryForwardMaxPercent,
      }),
    onSuccess: async () => {
      if (companyId) await invalidateAuthorityTax(companyId);
    },
  });
}

export function useSettleInvoiceIncomeWht(companyId: string | undefined) {
  return useMutation({
    mutationFn: (args: { invoiceId: string; paymentDate: string; bankAccountId?: string }) =>
      settleInvoiceIncomeWht(companyId!, args.invoiceId, {
        paymentDate: args.paymentDate,
        bankAccountId: args.bankAccountId,
      }),
    onSuccess: async () => {
      if (companyId) await invalidateAuthorityTax(companyId);
    },
  });
}

export function useClaimBillPurchaseTax(companyId: string | undefined) {
  return useMutation({
    mutationFn: (args: { billId: string; paymentDate: string }) =>
      claimBillPurchaseTax(companyId!, args.billId, { paymentDate: args.paymentDate }),
    onSuccess: async () => {
      if (companyId) await invalidateAuthorityTax(companyId);
    },
  });
}

export function useSettleBillIncomeWht(companyId: string | undefined) {
  return useMutation({
    mutationFn: (args: { billId: string; paymentDate: string; bankAccountId?: string }) =>
      settleBillIncomeWht(companyId!, args.billId, {
        paymentDate: args.paymentDate,
        bankAccountId: args.bankAccountId,
      }),
    onSuccess: async () => {
      if (companyId) await invalidateAuthorityTax(companyId);
    },
  });
}

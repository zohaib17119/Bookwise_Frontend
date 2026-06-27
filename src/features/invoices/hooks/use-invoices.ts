import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createInvoice,
  deleteInvoice,
  getInvoice,
  getInvoices,
  getInvoicesPaginated,
  updateInvoice,
  getNextInvoiceNumber,
  sendInvoice,
} from "@/features/invoices/api/invoices.api";
import type {
  InvoiceListParams,
  InvoicePayload,
} from "@/features/invoices/types/invoice.types";
import { queryClient } from "@/lib/query/query-client";

function invalidateInvoiceQueries(companyId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "invoices"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "customer-payments"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "dashboard"] }),
  ]);
}

export function useInvoices(companyId: string | undefined, params: InvoiceListParams) {
  return useQuery({
    queryKey: ["companies", companyId, "invoices", params],
    queryFn: () => getInvoices(companyId!, params),
    enabled: Boolean(companyId),
  });
}

export function useInvoicesPaginated(companyId: string | undefined, params: InvoiceListParams) {
  return useQuery({
    queryKey: ["companies", companyId, "invoices", "paginated", params],
    queryFn: () => getInvoicesPaginated(companyId!, params),
    enabled: Boolean(companyId),
  });
}

export function useInvoice(companyId: string | undefined, invoiceId: string | null) {
  return useQuery({
    queryKey: ["companies", companyId, "invoices", invoiceId],
    queryFn: () => getInvoice(companyId!, invoiceId!),
    enabled: Boolean(companyId && invoiceId),
  });
}

export function useOpenInvoicesByCustomer(
  companyId: string | undefined,
  customerId: string | undefined,
) {
  return useQuery({
    queryKey: ["companies", companyId, "invoices", "open", customerId],
    queryFn: () => getInvoices(companyId!, { customerId, limit: 100 }),
    enabled: Boolean(companyId && customerId),
    select: (data) => data.filter((invoice) => (invoice.amountDue ?? 0) > 0),
  });
}

export function useCreateInvoice(companyId: string | undefined) {
  return useMutation({
    mutationFn: (payload: InvoicePayload) => createInvoice(companyId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateInvoiceQueries(companyId);
    },
  });
}

export function useUpdateInvoice(companyId: string | undefined, invoiceId: string | null) {
  return useMutation({
    mutationFn: (payload: InvoicePayload) =>
      updateInvoice(companyId!, invoiceId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateInvoiceQueries(companyId);
    },
  });
}

export function useDeleteInvoice(companyId: string | undefined) {
  return useMutation({
    mutationFn: (invoiceId: string) => deleteInvoice(companyId!, invoiceId),
    onSuccess: async () => {
      if (companyId) await invalidateInvoiceQueries(companyId);
    },
  });
}

export function useSendInvoice(companyId: string | undefined) {
  return useMutation({
    mutationFn: (invoiceId: string) => sendInvoice(companyId!, invoiceId),
    onSuccess: async () => {
      if (companyId) await invalidateInvoiceQueries(companyId);
    },
  });
}

export function useNextInvoiceNumber(companyId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["companies", companyId, "invoices", "next-number"],
    queryFn: () => getNextInvoiceNumber(companyId!),
    enabled: Boolean(companyId) && enabled,
    staleTime: 0,
    gcTime: 0,
  });
}

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createDeliveryChallan,
  getDeliveryChallanRemaining,
  listDeliveryChallans,
  renderDeliveryChallanHtml,
} from "@/features/invoices/api/delivery-challans.api";
import type { CreateDeliveryChallanPayload } from "@/features/invoices/types/delivery-challan.types";
import { queryClient } from "@/lib/query/query-client";

function invalidateDcQueries(companyId: string, invoiceId: string) {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: ["companies", companyId, "invoices", invoiceId],
    }),
    queryClient.invalidateQueries({
      queryKey: ["companies", companyId, "invoices", invoiceId, "delivery-challans"],
    }),
  ]);
}

export function useDeliveryChallans(companyId: string | undefined, invoiceId: string | null) {
  return useQuery({
    queryKey: ["companies", companyId, "invoices", invoiceId, "delivery-challans"],
    queryFn: () => listDeliveryChallans(companyId!, invoiceId!),
    enabled: Boolean(companyId && invoiceId),
  });
}

export function useDeliveryChallanRemaining(
  companyId: string | undefined,
  invoiceId: string | null,
  enabled = true,
) {
  return useQuery({
    queryKey: ["companies", companyId, "invoices", invoiceId, "delivery-challans", "remaining"],
    queryFn: () => getDeliveryChallanRemaining(companyId!, invoiceId!),
    enabled: Boolean(companyId && invoiceId && enabled),
  });
}

export function useCreateDeliveryChallan(
  companyId: string | undefined,
  invoiceId: string | null,
) {
  return useMutation({
    mutationFn: (payload: CreateDeliveryChallanPayload) =>
      createDeliveryChallan(companyId!, invoiceId!, payload),
    onSuccess: async () => {
      if (companyId && invoiceId) await invalidateDcQueries(companyId, invoiceId);
    },
  });
}

export function useRenderDeliveryChallan(
  companyId: string | undefined,
  invoiceId: string | null,
) {
  return useMutation({
    mutationFn: (dcId: string) => renderDeliveryChallanHtml(companyId!, invoiceId!, dcId),
  });
}

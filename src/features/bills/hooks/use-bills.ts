import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createBill,
  deleteBill,
  getBill,
  getBills,
  getBillsPaginated,
  updateBill,
  issueBill,
} from "@/features/bills/api/bills.api";
import type { BillListParams, BillPayload } from "@/features/bills/types/bill.types";
import { queryClient } from "@/lib/query/query-client";

function invalidateBillQueries(companyId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "bills"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "bill-payments"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "dashboard"] }),
  ]);
}

export function useBills(companyId: string | undefined, params: BillListParams) {
  return useQuery({
    queryKey: ["companies", companyId, "bills", params],
    queryFn: () => getBills(companyId!, params),
    enabled: Boolean(companyId),
  });
}

export function useBillsPaginated(companyId: string | undefined, params: BillListParams) {
  return useQuery({
    queryKey: ["companies", companyId, "bills", "paginated", params],
    queryFn: () => getBillsPaginated(companyId!, params),
    enabled: Boolean(companyId),
  });
}

export function useBill(companyId: string | undefined, billId: string | null) {
  return useQuery({
    queryKey: ["companies", companyId, "bills", billId],
    queryFn: () => getBill(companyId!, billId!),
    enabled: Boolean(companyId && billId),
  });
}

export function useOpenBillsByVendor(
  companyId: string | undefined,
  vendorId: string | undefined,
) {
  return useQuery({
    queryKey: ["companies", companyId, "bills", "open", vendorId],
    queryFn: () => getBills(companyId!, { vendorId, limit: 100 }),
    enabled: Boolean(companyId && vendorId),
    select: (data) => data.filter((bill) => (bill.amountDue ?? 0) > 0),
  });
}

export function useCreateBill(companyId: string | undefined) {
  return useMutation({
    mutationFn: (payload: BillPayload) => createBill(companyId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateBillQueries(companyId);
    },
  });
}

export function useUpdateBill(companyId: string | undefined, billId: string | null) {
  return useMutation({
    mutationFn: (payload: BillPayload) => updateBill(companyId!, billId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateBillQueries(companyId);
    },
  });
}

export function useDeleteBill(companyId: string | undefined) {
  return useMutation({
    mutationFn: (billId: string) => deleteBill(companyId!, billId),
    onSuccess: async () => {
      if (companyId) await invalidateBillQueries(companyId);
    },
  });
}

export function useIssueBill(companyId: string | undefined) {
  return useMutation({
    mutationFn: (billId: string) => issueBill(companyId!, billId),
    onSuccess: async () => {
      if (companyId) await invalidateBillQueries(companyId);
    },
  });
}

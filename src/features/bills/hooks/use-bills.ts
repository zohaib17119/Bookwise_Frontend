import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createBill,
  deleteBill,
  getBill,
  getBills,
  getBillsPaginated,
  getNextBillNumber,
  updateBill,
  issueBill,
  receiveBillGoods,
  voidBill,
  markBillTaxReported,
} from "@/features/bills/api/bills.api";
import type { BillListParams, BillPayload } from "@/features/bills/types/bill.types";
import { isAllocatableBillStatus, parseMoney } from "@/lib/utils/money";
import { queryClient } from "@/lib/query/query-client";

function invalidateBillQueries(companyId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "bills"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "bill-payments"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "dashboard"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "inventory"] }),
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

export function useNextBillNumber(companyId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["companies", companyId, "bills", "next-number"],
    queryFn: () => getNextBillNumber(companyId!),
    enabled: Boolean(companyId && enabled),
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
    select: (data) =>
      data.filter(
        (bill) =>
          isAllocatableBillStatus(bill.status, bill.rawStatus) &&
          parseMoney(bill.amountDue) > 0,
      ),
  });
}

export function useCreateBill(companyId: string | undefined) {
  return useMutation({
    mutationFn: (payload: BillPayload) => createBill(companyId!, payload),
    onSuccess: async () => {
      if (companyId) {
        await invalidateBillQueries(companyId);
        await queryClient.invalidateQueries({
          queryKey: ["companies", companyId, "bills", "next-number"],
        });
      }
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

export function useReceiveBillGoods(companyId: string | undefined) {
  return useMutation({
    mutationFn: ({
      billId,
      payload,
    }: {
      billId: string;
      payload?: { lines?: Array<{ billLineId: string; quantity: string }> };
    }) => receiveBillGoods(companyId!, billId, payload),
    onSuccess: async () => {
      if (companyId) await invalidateBillQueries(companyId);
    },
  });
}

export function useVoidBill(companyId: string | undefined) {
  return useMutation({
    mutationFn: (billId: string) => voidBill(companyId!, billId),
    onSuccess: async () => {
      if (companyId) await invalidateBillQueries(companyId);
    },
  });
}

export function useMarkBillTaxReported(companyId: string | undefined) {
  return useMutation({
    mutationFn: (billId: string) => markBillTaxReported(companyId!, billId),
    onSuccess: async (_data, billId) => {
      if (!companyId) return;
      await Promise.all([
        invalidateBillQueries(companyId),
        queryClient.invalidateQueries({
          queryKey: ["companies", companyId, "bills", billId],
        }),
      ]);
    },
  });
}

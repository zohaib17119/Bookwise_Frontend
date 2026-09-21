import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createInvestor,
  createInvestorInvestment,
  deleteInvestor,
  getInvestor,
  getInvestorInvestments,
  getInvestorsPaginated,
  getNextInvestorCode,
  updateInvestor,
} from "@/features/investors/api/investors.api";
import type {
  CreateInvestmentPayload,
  InvestorListParams,
  InvestorPayload,
} from "@/features/investors/types/investor.types";
import { queryClient } from "@/lib/query/query-client";

function invalidateInvestorQueries(companyId: string, investorId?: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "investors"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "dashboard"] }),
    investorId
      ? queryClient.invalidateQueries({
          queryKey: ["companies", companyId, "investors", investorId],
        })
      : Promise.resolve(),
  ]);
}

export function useInvestorsPaginated(
  companyId: string | undefined,
  params: InvestorListParams,
) {
  return useQuery({
    queryKey: ["companies", companyId, "investors", "paginated", params],
    queryFn: () => getInvestorsPaginated(companyId!, params),
    enabled: Boolean(companyId),
  });
}

export function useInvestor(companyId: string | undefined, investorId: string | null) {
  return useQuery({
    queryKey: ["companies", companyId, "investors", investorId],
    queryFn: () => getInvestor(companyId!, investorId!),
    enabled: Boolean(companyId && investorId),
  });
}

export function useNextInvestorCode(companyId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["companies", companyId, "investors", "next-code"],
    queryFn: () => getNextInvestorCode(companyId!),
    enabled: Boolean(companyId && enabled),
  });
}

export function useInvestorInvestments(
  companyId: string | undefined,
  investorId: string | null,
  params: { page?: number; limit?: number } = {},
) {
  return useQuery({
    queryKey: ["companies", companyId, "investors", investorId, "investments", params],
    queryFn: () => getInvestorInvestments(companyId!, investorId!, params),
    enabled: Boolean(companyId && investorId),
  });
}

export function useCreateInvestor(companyId: string | undefined) {
  return useMutation({
    mutationFn: (payload: InvestorPayload) => createInvestor(companyId!, payload),
    onSuccess: async () => {
      if (companyId) {
        await invalidateInvestorQueries(companyId);
        await queryClient.invalidateQueries({
          queryKey: ["companies", companyId, "investors", "next-code"],
        });
      }
    },
  });
}

export function useUpdateInvestor(companyId: string | undefined, investorId: string | null) {
  return useMutation({
    mutationFn: (payload: Partial<InvestorPayload>) =>
      updateInvestor(companyId!, investorId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateInvestorQueries(companyId, investorId ?? undefined);
    },
  });
}

export function useDeleteInvestor(companyId: string | undefined) {
  return useMutation({
    mutationFn: (investorId: string) => deleteInvestor(companyId!, investorId),
    onSuccess: async () => {
      if (companyId) await invalidateInvestorQueries(companyId);
    },
  });
}

export function useCreateInvestorInvestment(
  companyId: string | undefined,
  investorId: string | null,
) {
  return useMutation({
    mutationFn: (payload: CreateInvestmentPayload) =>
      createInvestorInvestment(companyId!, investorId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateInvestorQueries(companyId, investorId ?? undefined);
    },
  });
}

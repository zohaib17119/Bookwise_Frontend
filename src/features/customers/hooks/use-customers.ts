import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createCustomer,
  deleteCustomer,
  getCustomer,
  getCustomers,
  updateCustomer,
} from "@/features/customers/api/customers.api";
import type {
  CustomerListParams,
  CustomerPayload,
} from "@/features/customers/types/customer.types";
import { queryClient } from "@/lib/query/query-client";

export function useCustomers(
  companyId: string | undefined,
  params: CustomerListParams,
) {
  return useQuery({
    queryKey: ["companies", companyId, "customers", params],
    queryFn: () => getCustomers(companyId!, params),
    enabled: Boolean(companyId),
  });
}

export function useCustomer(companyId: string | undefined, customerId: string | null) {
  return useQuery({
    queryKey: ["companies", companyId, "customers", customerId],
    queryFn: () => getCustomer(companyId!, customerId!),
    enabled: Boolean(companyId && customerId),
  });
}

export function useCustomerOptions(companyId: string | undefined) {
  return useQuery({
    queryKey: ["companies", companyId, "customers", "options"],
    queryFn: () => getCustomers(companyId!, { includeInactive: false }),
    enabled: Boolean(companyId),
  });
}

function invalidateCustomerQueries(companyId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "customers"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "dashboard"] }),
  ]);
}

export function useCreateCustomer(companyId: string | undefined) {
  return useMutation({
    mutationFn: (payload: CustomerPayload) => createCustomer(companyId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateCustomerQueries(companyId);
    },
  });
}

export function useUpdateCustomer(
  companyId: string | undefined,
  customerId: string | null,
) {
  return useMutation({
    mutationFn: (payload: CustomerPayload) =>
      updateCustomer(companyId!, customerId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateCustomerQueries(companyId);
    },
  });
}

export function useDeleteCustomer(companyId: string | undefined) {
  return useMutation({
    mutationFn: (customerId: string) => deleteCustomer(companyId!, customerId),
    onSuccess: async () => {
      if (companyId) await invalidateCustomerQueries(companyId);
    },
  });
}

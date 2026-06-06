import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createVendor,
  deleteVendor,
  getVendor,
  getVendors,
  updateVendor,
} from "@/features/vendors/api/vendors.api";
import type {
  VendorListParams,
  VendorPayload,
} from "@/features/vendors/types/vendor.types";
import { queryClient } from "@/lib/query/query-client";

export function useVendors(companyId: string | undefined, params: VendorListParams) {
  return useQuery({
    queryKey: ["companies", companyId, "vendors", params],
    queryFn: () => getVendors(companyId!, params),
    enabled: Boolean(companyId),
  });
}

export function useVendor(companyId: string | undefined, vendorId: string | null) {
  return useQuery({
    queryKey: ["companies", companyId, "vendors", vendorId],
    queryFn: () => getVendor(companyId!, vendorId!),
    enabled: Boolean(companyId && vendorId),
  });
}

export function useVendorOptions(companyId: string | undefined) {
  return useQuery({
    queryKey: ["companies", companyId, "vendors", "options"],
    queryFn: () => getVendors(companyId!, { includeInactive: false }),
    enabled: Boolean(companyId),
  });
}

function invalidateVendorQueries(companyId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "vendors"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "dashboard"] }),
  ]);
}

export function useCreateVendor(companyId: string | undefined) {
  return useMutation({
    mutationFn: (payload: VendorPayload) => createVendor(companyId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateVendorQueries(companyId);
    },
  });
}

export function useUpdateVendor(companyId: string | undefined, vendorId: string | null) {
  return useMutation({
    mutationFn: (payload: VendorPayload) =>
      updateVendor(companyId!, vendorId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateVendorQueries(companyId);
    },
  });
}

export function useDeleteVendor(companyId: string | undefined) {
  return useMutation({
    mutationFn: (vendorId: string) => deleteVendor(companyId!, vendorId),
    onSuccess: async () => {
      if (companyId) await invalidateVendorQueries(companyId);
    },
  });
}

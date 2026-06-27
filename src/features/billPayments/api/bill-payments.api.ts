import { apiClient } from "@/lib/api/client";
import { extractListData } from "@/lib/api/response";
import type {
  BillPayment,
  BillPaymentAllocationPayload,
  BillPaymentListParams,
  BillPaymentPayload,
} from "@/features/billPayments/types/bill-payment.types";

function buildQuery(params: BillPaymentListParams) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.vendorId) query.set("vendorId", params.vendorId);
  query.set("limit", String(params.limit ?? 100));
  if (params.page) query.set("page", String(params.page));
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export async function getBillPayments(
  companyId: string,
  params: BillPaymentListParams = {},
) {
  const { data } = await apiClient.get<BillPayment[]>(
    `/companies/${companyId}/bill-payments${buildQuery(params)}`,
  );
  return extractListData(data);
}

export async function getBillPayment(companyId: string, paymentId: string) {
  const { data } = await apiClient.get<BillPayment>(
    `/companies/${companyId}/bill-payments/${paymentId}`,
  );
  return data;
}

export async function createBillPayment(
  companyId: string,
  payload: BillPaymentPayload,
) {
  const { data } = await apiClient.post<BillPayment>(
    `/companies/${companyId}/bill-payments`,
    payload,
  );
  return data;
}

export async function allocateBillPayment(
  paymentId: string,
  payload: BillPaymentAllocationPayload,
) {
  const { data } = await apiClient.post<BillPayment>(
    `/bill-payments/${paymentId}/allocate`,
    payload,
  );
  return data;
}

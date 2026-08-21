import { apiClient } from "@/lib/api/client";
import { extractListData } from "@/lib/api/response";
import type {
  BillPayment,
  BillPaymentAllocationPayload,
  BillPaymentListParams,
  BillPaymentPayload,
} from "@/features/billPayments/types/bill-payment.types";
import { omitEmptyFields, serializeMoneyField } from "@/features/shared/utils/api-payload";

function buildQuery(params: BillPaymentListParams) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.vendorId) query.set("vendorId", params.vendorId);
  query.set("limit", String(params.limit ?? 100));
  if (params.page) query.set("page", String(params.page));
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

function serializeBillPaymentPayload(payload: BillPaymentPayload): BillPaymentPayload {
  return {
    vendorId: payload.vendorId,
    paymentMethod: payload.paymentMethod,
    amount: serializeMoneyField(payload.amount),
    ...omitEmptyFields({
      paymentDate: payload.paymentDate || undefined,
      referenceNumber: payload.referenceNumber || undefined,
      currencyCode: payload.currencyCode || undefined,
      exchangeRate: payload.exchangeRate || undefined,
      notes: payload.notes || undefined,
    }),
  };
}

function serializeBillPaymentAllocationPayload(
  payload: BillPaymentAllocationPayload,
): BillPaymentAllocationPayload {
  return {
    allocations: payload.allocations.map((allocation) => ({
      billId: allocation.billId,
      amount: serializeMoneyField(allocation.amount),
    })),
  };
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
    serializeBillPaymentPayload(payload),
  );
  return data;
}

export async function allocateBillPayment(
  paymentId: string,
  payload: BillPaymentAllocationPayload,
) {
  const { data } = await apiClient.post<BillPayment>(
    `/bill-payments/${paymentId}/allocate`,
    serializeBillPaymentAllocationPayload(payload),
  );
  return data;
}

export async function unallocateBillPayment(paymentId: string, billId: string) {
  const { data } = await apiClient.post<BillPayment>(`/bill-payments/${paymentId}/unallocate`, {
    billId,
  });
  return data;
}

export async function updateBillPayment(
  companyId: string,
  paymentId: string,
  payload: { amount: string },
) {
  const { data } = await apiClient.patch<BillPayment>(
    `/companies/${companyId}/bill-payments/${paymentId}`,
    { amount: serializeMoneyField(payload.amount) },
  );
  return data;
}

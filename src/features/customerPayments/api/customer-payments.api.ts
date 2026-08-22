import { apiClient } from "@/lib/api/client";
import { extractListData } from "@/lib/api/response";
import type {
  CustomerPayment,
  CustomerPaymentAllocationPayload,
  CustomerPaymentListParams,
  CustomerPaymentPayload,
} from "@/features/customerPayments/types/customer-payment.types";
import { omitEmptyFields, serializeMoneyField } from "@/features/shared/utils/api-payload";

function buildQuery(params: CustomerPaymentListParams) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.customerId) query.set("customerId", params.customerId);
  query.set("limit", String(params.limit ?? 100));
  if (params.page) query.set("page", String(params.page));
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

function serializeCustomerPaymentPayload(payload: CustomerPaymentPayload): CustomerPaymentPayload {
  return {
    customerId: payload.customerId,
    paymentMethod: payload.paymentMethod,
    amount: serializeMoneyField(payload.amount),
    ...omitEmptyFields({
      paymentDate: payload.paymentDate || undefined,
      referenceNumber: payload.referenceNumber || undefined,
      currencyCode: payload.currencyCode || undefined,
      exchangeRate: payload.exchangeRate || undefined,
      notes: payload.notes || undefined,
    }),
    ...(payload.allocations?.length
      ? {
          allocations: payload.allocations.map((allocation) => ({
            invoiceId: allocation.invoiceId,
            amount: serializeMoneyField(allocation.amount),
          })),
        }
      : {}),
  };
}

function serializeCustomerPaymentAllocationPayload(
  payload: CustomerPaymentAllocationPayload,
): CustomerPaymentAllocationPayload {
  return {
    allocations: payload.allocations.map((allocation) => ({
      invoiceId: allocation.invoiceId,
      amount: serializeMoneyField(allocation.amount),
    })),
  };
}

export async function getCustomerPayments(
  companyId: string,
  params: CustomerPaymentListParams = {},
) {
  const { data } = await apiClient.get<CustomerPayment[]>(
    `/companies/${companyId}/customer-payments${buildQuery(params)}`,
  );
  return extractListData(data);
}

export async function getCustomerPayment(companyId: string, paymentId: string) {
  const { data } = await apiClient.get<CustomerPayment>(
    `/companies/${companyId}/customer-payments/${paymentId}`,
  );
  return data;
}

export async function createCustomerPayment(
  companyId: string,
  payload: CustomerPaymentPayload,
) {
  const { data } = await apiClient.post<CustomerPayment>(
    `/companies/${companyId}/customer-payments`,
    serializeCustomerPaymentPayload(payload),
  );
  return data;
}

export async function allocateCustomerPayment(
  paymentId: string,
  payload: CustomerPaymentAllocationPayload,
) {
  const { data } = await apiClient.post<CustomerPayment>(
    `/customer-payments/${paymentId}/allocate`,
    serializeCustomerPaymentAllocationPayload(payload),
  );
  return data;
}

export async function updateCustomerPayment(
  companyId: string,
  paymentId: string,
  payload: { amount: string },
) {
  const { data } = await apiClient.patch<CustomerPayment>(
    `/companies/${companyId}/customer-payments/${paymentId}`,
    { amount: serializeMoneyField(payload.amount) },
  );
  return data;
}

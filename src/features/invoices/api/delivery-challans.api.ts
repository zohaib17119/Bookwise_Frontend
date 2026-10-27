import { apiClient } from "@/lib/api/client";
import type {
  CreateDeliveryChallanPayload,
  DeliveryChallan,
  DeliveryChallanRemaining,
} from "@/features/invoices/types/delivery-challan.types";

export async function listDeliveryChallans(companyId: string, invoiceId: string) {
  const { data } = await apiClient.get<DeliveryChallan[]>(
    `/companies/${companyId}/invoices/${invoiceId}/delivery-challans`,
  );
  return Array.isArray(data) ? data : [];
}

export async function getDeliveryChallanRemaining(companyId: string, invoiceId: string) {
  const { data } = await apiClient.get<DeliveryChallanRemaining>(
    `/companies/${companyId}/invoices/${invoiceId}/delivery-challans/remaining`,
  );
  return data;
}

export async function getDeliveryChallan(companyId: string, invoiceId: string, dcId: string) {
  const { data } = await apiClient.get<DeliveryChallan>(
    `/companies/${companyId}/invoices/${invoiceId}/delivery-challans/${dcId}`,
  );
  return data;
}

export async function createDeliveryChallan(
  companyId: string,
  invoiceId: string,
  payload: CreateDeliveryChallanPayload,
) {
  const { data } = await apiClient.post<DeliveryChallan>(
    `/companies/${companyId}/invoices/${invoiceId}/delivery-challans`,
    payload,
  );
  return data;
}

export async function renderDeliveryChallanHtml(
  companyId: string,
  invoiceId: string,
  dcId: string,
) {
  const { data } = await apiClient.get<{
    format: string;
    content: string;
    contentType: string;
  }>(`/companies/${companyId}/invoices/${invoiceId}/delivery-challans/${dcId}/render?format=a4`);
  return data;
}

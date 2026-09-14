import { apiClient } from "@/lib/api/client";

export type FbrMonitoringSummary = {
  total: number;
  submitted: number;
  pending: number;
  processing: number;
  retrying: number;
  rejected: number;
  failed: number;
  failedOrRejected: number;
  notApplicable: number;
  byStatus: Record<string, number>;
};

export type FbrMonitoringInvoice = {
  id: string;
  invoiceNumber?: string | null;
  documentType?: string | null;
  status?: string | null;
  issueDate?: string | null;
  customerId: string;
  customerName: string;
  fbrSubmissionStatus: string;
  fbrStatusLabel: string;
  fbrSubmittedAt?: string | null;
  fbrFbrInvoiceNumber?: string | null;
  fbrInvoiceRefNo?: string | null;
  fbrAttemptCount?: number | null;
  fbrLastError?: string | null;
  fbrLastResponseCode?: string | null;
  canRetry: boolean;
};

export type FbrMonitoringLog = {
  id: string;
  operation: string;
  success: boolean;
  httpStatus?: number | null;
  errorMessage?: string | null;
  fbrInvoiceNumber?: string | null;
  requestHash?: string | null;
  idempotencyKey?: string | null;
  createdAt: string;
};

export async function getFbrMonitoringSummary(
  companyId: string,
  params?: { fromDate?: string; toDate?: string },
) {
  const { data } = await apiClient.get<FbrMonitoringSummary>(
    `/companies/${companyId}/fbr/monitoring/summary`,
    { params },
  );
  return data;
}

export async function listFbrMonitoringInvoices(
  companyId: string,
  params?: {
    status?: string;
    search?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  },
) {
  const { data } = await apiClient.get<{
    items: FbrMonitoringInvoice[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>(`/companies/${companyId}/fbr/monitoring/invoices`, { params });
  return data;
}

export async function listFbrInvoiceLogs(companyId: string, invoiceId: string) {
  const { data } = await apiClient.get<{
    invoiceId: string;
    invoiceNumber?: string | null;
    logs: FbrMonitoringLog[];
  }>(`/companies/${companyId}/fbr/monitoring/invoices/${invoiceId}/logs`);
  return data;
}

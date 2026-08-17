import { apiClient } from "@/lib/api/client";
import type {
  DocumentTemplateKind,
  InvoiceDocumentTemplate,
  InvoiceTemplateLayout,
} from "@/features/settings/types/invoice-template.types";

export async function listInvoiceDocumentTemplates(
  companyId: string,
  kind: DocumentTemplateKind = "INVOICE",
) {
  const { data } = await apiClient.get<InvoiceDocumentTemplate[]>(
    `/companies/${companyId}/invoice-document-templates?kind=${kind}`,
  );
  return Array.isArray(data) ? data : [];
}

export async function getInvoiceDocumentTemplate(companyId: string, templateId: string) {
  const { data } = await apiClient.get<InvoiceDocumentTemplate>(
    `/companies/${companyId}/invoice-document-templates/${templateId}`,
  );
  return data;
}

export async function getDefaultInvoiceTemplateLayout(
  companyId: string,
  kind: DocumentTemplateKind = "INVOICE",
) {
  const { data } = await apiClient.get<{ layoutJson: InvoiceTemplateLayout }>(
    `/companies/${companyId}/invoice-document-templates/default-layout?kind=${kind}`,
  );
  return data.layoutJson;
}

export async function createInvoiceDocumentTemplate(
  companyId: string,
  payload: {
    name: string;
    kind?: DocumentTemplateKind;
    isDefault?: boolean;
    layoutJson: InvoiceTemplateLayout;
  },
) {
  const { data } = await apiClient.post<InvoiceDocumentTemplate>(
    `/companies/${companyId}/invoice-document-templates`,
    payload,
  );
  return data;
}

export async function updateInvoiceDocumentTemplate(
  companyId: string,
  templateId: string,
  payload: Partial<{ name: string; isDefault: boolean; layoutJson: InvoiceTemplateLayout }>,
) {
  const { data } = await apiClient.patch<InvoiceDocumentTemplate>(
    `/companies/${companyId}/invoice-document-templates/${templateId}`,
    payload,
  );
  return data;
}

export async function deleteInvoiceDocumentTemplate(companyId: string, templateId: string) {
  await apiClient.delete(`/companies/${companyId}/invoice-document-templates/${templateId}`);
}

export async function previewInvoiceDocumentTemplate(
  companyId: string,
  layoutJson: InvoiceTemplateLayout,
) {
  const { data } = await apiClient.post<{ html: string }>(
    `/companies/${companyId}/invoice-document-templates/preview`,
    { layoutJson },
  );
  return data.html;
}

export async function renderInvoiceHtml(
  companyId: string,
  invoiceId: string,
  format: "a4" | "email" | "t58" | "t80" = "a4",
) {
  const { data } = await apiClient.get<{
    format: string;
    content: string;
    contentType: string;
  }>(`/companies/${companyId}/invoices/${invoiceId}/render?format=${format}`);
  return data;
}

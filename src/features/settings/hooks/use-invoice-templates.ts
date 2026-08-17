import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createInvoiceDocumentTemplate,
  deleteInvoiceDocumentTemplate,
  listInvoiceDocumentTemplates,
  previewInvoiceDocumentTemplate,
  updateInvoiceDocumentTemplate,
} from "@/features/settings/api/invoice-templates.api";
import type {
  DocumentTemplateKind,
  InvoiceTemplateLayout,
} from "@/features/settings/types/invoice-template.types";
import { queryClient } from "@/lib/query/query-client";

function invalidate(companyId: string, kind: DocumentTemplateKind = "INVOICE") {
  return queryClient.invalidateQueries({
    queryKey: ["companies", companyId, "invoice-document-templates", kind],
  });
}

export function useInvoiceDocumentTemplates(
  companyId: string | undefined,
  kind: DocumentTemplateKind = "INVOICE",
) {
  return useQuery({
    queryKey: ["companies", companyId, "invoice-document-templates", kind],
    queryFn: () => listInvoiceDocumentTemplates(companyId!, kind),
    enabled: Boolean(companyId),
  });
}

export function useCreateInvoiceDocumentTemplate(
  companyId: string | undefined,
  kind: DocumentTemplateKind = "INVOICE",
) {
  return useMutation({
    mutationFn: (payload: {
      name: string;
      kind?: DocumentTemplateKind;
      isDefault?: boolean;
      layoutJson: InvoiceTemplateLayout;
    }) => createInvoiceDocumentTemplate(companyId!, { ...payload, kind: payload.kind ?? kind }),
    onSuccess: async () => {
      if (companyId) await invalidate(companyId, kind);
    },
  });
}

export function useUpdateInvoiceDocumentTemplate(
  companyId: string | undefined,
  kind: DocumentTemplateKind = "INVOICE",
) {
  return useMutation({
    mutationFn: (args: {
      templateId: string;
      payload: Partial<{ name: string; isDefault: boolean; layoutJson: InvoiceTemplateLayout }>;
    }) => updateInvoiceDocumentTemplate(companyId!, args.templateId, args.payload),
    onSuccess: async () => {
      if (companyId) await invalidate(companyId, kind);
    },
  });
}

export function useDeleteInvoiceDocumentTemplate(
  companyId: string | undefined,
  kind: DocumentTemplateKind = "INVOICE",
) {
  return useMutation({
    mutationFn: (templateId: string) => deleteInvoiceDocumentTemplate(companyId!, templateId),
    onSuccess: async () => {
      if (companyId) await invalidate(companyId, kind);
    },
  });
}

export function usePreviewInvoiceDocumentTemplate(companyId: string | undefined) {
  return useMutation({
    mutationFn: (layoutJson: InvoiceTemplateLayout) =>
      previewInvoiceDocumentTemplate(companyId!, layoutJson),
  });
}

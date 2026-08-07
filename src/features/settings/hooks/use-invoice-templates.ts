import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createInvoiceDocumentTemplate,
  deleteInvoiceDocumentTemplate,
  listInvoiceDocumentTemplates,
  previewInvoiceDocumentTemplate,
  updateInvoiceDocumentTemplate,
} from "@/features/settings/api/invoice-templates.api";
import type { InvoiceTemplateLayout } from "@/features/settings/types/invoice-template.types";
import { queryClient } from "@/lib/query/query-client";

function invalidate(companyId: string) {
  return queryClient.invalidateQueries({
    queryKey: ["companies", companyId, "invoice-document-templates"],
  });
}

export function useInvoiceDocumentTemplates(companyId: string | undefined) {
  return useQuery({
    queryKey: ["companies", companyId, "invoice-document-templates"],
    queryFn: () => listInvoiceDocumentTemplates(companyId!),
    enabled: Boolean(companyId),
  });
}

export function useCreateInvoiceDocumentTemplate(companyId: string | undefined) {
  return useMutation({
    mutationFn: (payload: {
      name: string;
      isDefault?: boolean;
      layoutJson: InvoiceTemplateLayout;
    }) => createInvoiceDocumentTemplate(companyId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidate(companyId);
    },
  });
}

export function useUpdateInvoiceDocumentTemplate(companyId: string | undefined) {
  return useMutation({
    mutationFn: (args: {
      templateId: string;
      payload: Partial<{ name: string; isDefault: boolean; layoutJson: InvoiceTemplateLayout }>;
    }) => updateInvoiceDocumentTemplate(companyId!, args.templateId, args.payload),
    onSuccess: async () => {
      if (companyId) await invalidate(companyId);
    },
  });
}

export function useDeleteInvoiceDocumentTemplate(companyId: string | undefined) {
  return useMutation({
    mutationFn: (templateId: string) => deleteInvoiceDocumentTemplate(companyId!, templateId),
    onSuccess: async () => {
      if (companyId) await invalidate(companyId);
    },
  });
}

export function usePreviewInvoiceDocumentTemplate(companyId: string | undefined) {
  return useMutation({
    mutationFn: (layoutJson: InvoiceTemplateLayout) =>
      previewInvoiceDocumentTemplate(companyId!, layoutJson),
  });
}

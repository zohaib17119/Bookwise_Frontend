import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createCreditNote,
  getCreditNotesPaginated,
  type CreateCreditNotePayload,
  type CreditNoteListParams,
} from "@/features/creditNotes/api/credit-notes.api";
import { queryClient } from "@/lib/query/query-client";

function invalidateCreditNoteQueries(companyId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "credit-notes"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "invoices"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "dashboard"] }),
  ]);
}

export function useCreditNotesPaginated(
  companyId: string | undefined,
  params: CreditNoteListParams,
) {
  return useQuery({
    queryKey: ["companies", companyId, "credit-notes", "paginated", params],
    queryFn: () => getCreditNotesPaginated(companyId!, params),
    enabled: Boolean(companyId),
  });
}

export function useCreateCreditNote(companyId: string | undefined) {
  return useMutation({
    mutationFn: (payload: CreateCreditNotePayload) => createCreditNote(companyId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateCreditNoteQueries(companyId);
    },
  });
}

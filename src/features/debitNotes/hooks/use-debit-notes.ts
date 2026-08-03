import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createDebitNote,
  getDebitNotesPaginated,
  type CreateDebitNotePayload,
  type DebitNoteListParams,
} from "@/features/debitNotes/api/debit-notes.api";
import { queryClient } from "@/lib/query/query-client";

function invalidateDebitNoteQueries(companyId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "debit-notes"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "invoices"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "dashboard"] }),
  ]);
}

export function useDebitNotesPaginated(
  companyId: string | undefined,
  params: DebitNoteListParams,
) {
  return useQuery({
    queryKey: ["companies", companyId, "debit-notes", "paginated", params],
    queryFn: () => getDebitNotesPaginated(companyId!, params),
    enabled: Boolean(companyId),
  });
}

export function useCreateDebitNote(companyId: string | undefined) {
  return useMutation({
    mutationFn: (payload: CreateDebitNotePayload) => createDebitNote(companyId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateDebitNoteQueries(companyId);
    },
  });
}

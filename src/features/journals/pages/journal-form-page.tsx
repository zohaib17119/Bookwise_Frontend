import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { JournalLineEditor } from "@/components/accounting/journal-line-editor";
import { ErrorState } from "@/components/shared/error-state";
import { FieldGrid } from "@/components/shared/field-grid";
import { FormField } from "@/components/shared/form-field";
import { FormSection } from "@/components/shared/form-section";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { useAccountOptions } from "@/features/accounts/hooks/use-accounts";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import {
  useCreateJournalEntry,
  useJournalEntry,
  useUpdateJournalEntry,
} from "@/features/journals/hooks/use-journals";
import {
  journalEntrySchema,
  type JournalEntryFormInput,
  type JournalEntryFormValues,
} from "@/features/journals/schemas/journal.schema";
import { canManageEntity } from "@/features/permissions/utils/module-permissions";
import { formatCurrency } from "@/lib/utils/format";

interface JournalFormPageProps {
  mode: "create" | "edit";
}

export function JournalFormPage({ mode }: JournalFormPageProps) {
  const navigate = useNavigate();
  const { companyId, journalEntryId } = useParams();
  const { company, permissions } = useActiveCompany();
  const accountsQuery = useAccountOptions(companyId);
  const journalQuery = useJournalEntry(companyId, mode === "edit" ? journalEntryId ?? null : null);
  const createMutation = useCreateJournalEntry(companyId);
  const updateMutation = useUpdateJournalEntry(companyId, journalEntryId ?? null);
  const canManage = canManageEntity(permissions, "journals");

  const form = useForm<JournalEntryFormInput, undefined, JournalEntryFormValues>({
    resolver: zodResolver(journalEntrySchema),
    values:
      mode === "edit" && journalQuery.data
        ? {
            entryDate: journalQuery.data.entryDate ?? "",
            entryNumber: journalQuery.data.entryNumber ?? "",
            description: journalQuery.data.description ?? "",
            referenceNumber: journalQuery.data.referenceNumber ?? "",
            lines:
              journalQuery.data.lines?.map((line) => ({
                accountId: line.accountId,
                description: line.description ?? "",
                debitAmount: line.debitAmount ?? 0,
                creditAmount: line.creditAmount ?? 0,
              })) ?? [],
          }
        : {
            entryDate: "",
            entryNumber: "",
            description: "",
            referenceNumber: "",
            lines: [
              {
                accountId: "",
                description: "",
                debitAmount: 0,
                creditAmount: 0,
              },
              {
                accountId: "",
                description: "",
                debitAmount: 0,
                creditAmount: 0,
              },
            ],
          },
  });

  const activeMutation = mode === "create" ? createMutation : updateMutation;
  const lines = form.watch("lines");
  const debitTotal = useMemo(
    () => (lines ?? []).reduce((sum, line) => sum + Number(line.debitAmount || 0), 0),
    [lines],
  );
  const creditTotal = useMemo(
    () => (lines ?? []).reduce((sum, line) => sum + Number(line.creditAmount || 0), 0),
    [lines],
  );
  const isPosted = journalQuery.data?.status === "POSTED";

  if (!canManage) {
    return (
      <Alert
        title="Journal editing is unavailable"
        description="Your current company membership does not include journal management."
        variant="destructive"
      />
    );
  }

  if (mode === "edit" && journalQuery.error) {
    return (
      <ErrorState
        title="Unable to load journal entry"
        description={journalQuery.error.message}
      />
    );
  }

  return (
    <PageContainer
      header={
        <PageHeader
          actions={
            <Button asChild variant="ghost">
              <Link to={`/app/company/${companyId}/journals`}>Back to journals</Link>
            </Button>
          }
          description="Prepare a manual journal. Backend posting rules remain the source of truth for balancing and posting."
          eyebrow="Accounting"
          title={mode === "create" ? "New Journal Entry" : "Edit Journal Entry"}
        />
      }
    >
      <form
        className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"
        onSubmit={form.handleSubmit(async (values) => {
          const payload = {
            ...values,
            entryDate: values.entryDate || undefined,
            entryNumber: values.entryNumber || undefined,
            description: values.description || undefined,
            referenceNumber: values.referenceNumber || undefined,
            lines: values.lines.map((line) => ({
              accountId: line.accountId,
              description: line.description || undefined,
              debitAmount: Number(line.debitAmount || 0),
              creditAmount: Number(line.creditAmount || 0),
            })),
          };

          const result =
            mode === "create"
              ? await createMutation.mutateAsync(payload)
              : await updateMutation.mutateAsync(payload);

          navigate(`/app/company/${companyId}/journals/${result.id}`);
        })}
      >
        <div className="space-y-6">
          {activeMutation.error ? (
            <Alert title={activeMutation.error.message} variant="destructive" />
          ) : null}

          <FormSection title="Entry header">
            <FieldGrid>
              <FormField label="Entry date" error={form.formState.errors.entryDate?.message}>
                <Input disabled={isPosted} type="date" {...form.register("entryDate")} />
              </FormField>
              <FormField label="Entry number">
                <Input disabled={isPosted} {...form.register("entryNumber")} placeholder="JE-00041" />
              </FormField>
              <FormField label="Reference number">
                <Input disabled={isPosted} {...form.register("referenceNumber")} placeholder="Optional reference" />
              </FormField>
            </FieldGrid>
            <FormField label="Description">
              <Textarea disabled={isPosted} {...form.register("description")} placeholder="Describe the journal purpose" />
            </FormField>
          </FormSection>

          <FormSection title="Journal lines">
            <JournalLineEditor
              accounts={accountsQuery.data ?? []}
              control={form.control}
              disabled={isPosted}
              name="lines"
            />
          </FormSection>
        </div>

        <div className="space-y-4">
          <div className="surface p-5">
            <h3 className="text-base font-semibold">Balance preview</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Debit total</dt>
                <dd>{formatCurrency(debitTotal, company?.currency ?? "USD")}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Credit total</dt>
                <dd>{formatCurrency(creditTotal, company?.currency ?? "USD")}</dd>
              </div>
              <div className="flex items-center justify-between border-t pt-3 font-semibold">
                <dt>Status</dt>
                <dd>{Math.abs(debitTotal - creditTotal) < 0.0001 ? "Balanced" : "Out of balance"}</dd>
              </div>
            </dl>
          </div>
          <Button className="w-full" disabled={isPosted} isLoading={activeMutation.isPending} type="submit">
            {mode === "create" ? "Create journal" : "Save journal"}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { canUsePermission } from "@/features/permissions/utils/module-permissions";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { retryInvoiceFbrSubmit } from "@/features/invoices/api/invoices.api";
import { getApiErrorMessage } from "@/lib/api/error";
import { lastNDaysRange } from "@/lib/utils/date-range";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import {
  getFbrMonitoringSummary,
  listFbrInvoiceLogs,
  listFbrMonitoringInvoices,
  type FbrMonitoringInvoice,
} from "@/features/settings/api/fbr-monitoring.api";

const STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "RETRYING", label: "Retry scheduled" },
  { value: "FAILED_OR_REJECTED", label: "Failed / rejected" },
  { value: "FAILED", label: "Failed" },
  { value: "REJECTED", label: "Rejected" },
  { value: "NOT_APPLICABLE", label: "Not queued" },
] as const;

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/70 bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function FbrMonitoringPanel({ companyId }: { companyId: string }) {
  const { permissions } = useActiveCompany();
  const canRetry = canUsePermission(permissions, ["compliance.manage"]);
  const defaultRange = lastNDaysRange(30);
  const [fromDate, setFromDate] = useState(defaultRange.fromDate);
  const [toDate, setToDate] = useState(defaultRange.toDate);
  const [status, setStatus] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 200);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const filters = {
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    status: status === "ALL" ? undefined : status,
    search: debouncedSearch.trim() || undefined,
    page,
    limit: 25,
  };

  const summaryQuery = useQuery({
    queryKey: ["companies", companyId, "fbr", "monitoring", "summary", fromDate, toDate],
    queryFn: () => getFbrMonitoringSummary(companyId, { fromDate, toDate }),
    enabled: Boolean(companyId),
  });

  const listQuery = useQuery({
    queryKey: ["companies", companyId, "fbr", "monitoring", "invoices", filters],
    queryFn: () => listFbrMonitoringInvoices(companyId, filters),
    enabled: Boolean(companyId),
  });

  const logsQuery = useQuery({
    queryKey: ["companies", companyId, "fbr", "monitoring", "logs", expandedId],
    queryFn: () => listFbrInvoiceLogs(companyId, expandedId!),
    enabled: Boolean(companyId && expandedId),
  });

  const retryMutation = useMutation({
    mutationFn: (invoiceId: string) => retryInvoiceFbrSubmit(companyId, invoiceId),
    onSuccess: async (data) => {
      setActionError(null);
      setActionMessage(
        data.result.status === "SUBMITTED"
          ? `FBR accepted${data.fbrFbrInvoiceNumber ? ` (${data.fbrFbrInvoiceNumber})` : ""}.`
          : [
              data.fbrLastError || data.result.message || "FBR submit finished with errors.",
              data.guidance?.action,
              data.gatewayPreview ? `Gateway body: ${data.gatewayPreview}` : null,
            ]
              .filter(Boolean)
              .join(" · "),
      );
      await Promise.all([summaryQuery.refetch(), listQuery.refetch()]);
      if (expandedId) await logsQuery.refetch();
    },
    onError: (err) => {
      setActionMessage(null);
      setActionError(getApiErrorMessage(err));
    },
  });

  useEffect(() => {
    setPage(1);
  }, [fromDate, toDate, status, debouncedSearch]);

  const summary = summaryQuery.data;
  const items = listQuery.data?.items ?? [];
  const pagination = listQuery.data?.pagination;

  return (
    <div className="surface space-y-5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">FBR monitoring</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Status counts, submission errors, history, and manual retry for this company.
          </p>
        </div>
        <Link className="text-xs text-primary underline" to={`/app/company/${companyId}/audit`}>
          Company audit log
        </Link>
      </div>

      {actionError ? <Alert description={actionError} title="Retry failed" variant="destructive" /> : null}
      {actionMessage ? <Alert description={actionMessage} title="Queued" /> : null}
      {summaryQuery.error ? (
        <Alert
          description={summaryQuery.error.message}
          title="Unable to load FBR summary"
          variant="destructive"
        />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total" value={summary?.total ?? 0} />
        <StatCard label="Submitted" value={summary?.submitted ?? 0} />
        <StatCard label="Pending" value={summary?.pending ?? 0} />
        <StatCard label="Retrying" value={summary?.retrying ?? 0} />
        <StatCard label="Failed / rejected" value={summary?.failedOrRejected ?? 0} />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <label className="space-y-1 text-xs">
          <span className="text-muted-foreground">From</span>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted-foreground">To</span>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted-foreground">Status</span>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted-foreground">Invoice / customer / error</span>
          <Input
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>

      {listQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading invoices…</p>
      ) : listQuery.error ? (
        <Alert
          description={listQuery.error.message}
          title="Unable to load FBR invoices"
          variant="destructive"
        />
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No invoices match these filters.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/70">
          <table className="min-w-full text-sm">
            <thead className="bg-secondary/40 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Document</th>
                <th className="px-3 py-2 font-medium">Customer</th>
                <th className="px-3 py-2 font-medium">Issue</th>
                <th className="px-3 py-2 font-medium">FBR</th>
                <th className="px-3 py-2 font-medium">Error</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <MonitoringRow
                  key={row.id}
                  canRetry={canRetry}
                  companyId={companyId}
                  expanded={expandedId === row.id}
                  isRetrying={retryMutation.isPending && retryMutation.variables === row.id}
                  logs={expandedId === row.id ? logsQuery.data?.logs : undefined}
                  logsLoading={expandedId === row.id && logsQuery.isLoading}
                  onRetry={() => void retryMutation.mutateAsync(row.id)}
                  onToggle={() => setExpandedId((current) => (current === row.id ? null : row.id))}
                  row={row}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} rows
          </span>
          <div className="flex gap-2">
            <Button
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              type="button"
              variant="secondary"
            >
              Previous
            </Button>
            <Button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              type="button"
              variant="secondary"
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MonitoringRow({
  row,
  companyId,
  expanded,
  logs,
  logsLoading,
  canRetry,
  isRetrying,
  onToggle,
  onRetry,
}: {
  row: FbrMonitoringInvoice;
  companyId: string;
  expanded: boolean;
  logs?: Array<{
    id: string;
    operation: string;
    success: boolean;
    httpStatus?: number | null;
    errorMessage?: string | null;
    fbrInvoiceNumber?: string | null;
    createdAt: string;
  }>;
  logsLoading: boolean;
  canRetry: boolean;
  isRetrying: boolean;
  onToggle: () => void;
  onRetry: () => void;
}) {
  return (
    <>
      <tr className="border-t border-border/60 align-top">
        <td className="px-3 py-3">
          <Link className="font-medium text-primary" to={`/app/company/${companyId}/invoices/${row.id}`}>
            {row.invoiceNumber || "Untitled"}
          </Link>
          <p className="text-xs text-muted-foreground">
            {(row.documentType ?? "TAX_INVOICE").replace(/_/g, " ")}
            {row.fbrFbrInvoiceNumber ? ` · ${row.fbrFbrInvoiceNumber}` : ""}
          </p>
        </td>
        <td className="px-3 py-3">{row.customerName || "-"}</td>
        <td className="px-3 py-3 whitespace-nowrap">{formatDate(row.issueDate)}</td>
        <td className="px-3 py-3">
          <DocumentStatusBadge
            label={row.fbrStatusLabel}
            status={row.fbrSubmissionStatus}
          />
          {typeof row.fbrAttemptCount === "number" && row.fbrAttemptCount > 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">{row.fbrAttemptCount} attempts</p>
          ) : null}
        </td>
        <td className="px-3 py-3 max-w-[18rem]">
          <p className="line-clamp-2 text-xs text-muted-foreground">{row.fbrLastError || "—"}</p>
        </td>
        <td className="px-3 py-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={onToggle} type="button" variant="ghost">
              {expanded ? "Hide history" : "History"}
            </Button>
            {canRetry && row.canRetry ? (
              <Button isLoading={isRetrying} onClick={onRetry} type="button" variant="secondary">
                Retry
              </Button>
            ) : null}
          </div>
        </td>
      </tr>
      {expanded ? (
        <tr className="border-t border-border/40 bg-secondary/20">
          <td className="px-3 py-3" colSpan={6}>
            {logsLoading ? (
              <p className="text-xs text-muted-foreground">Loading submission history…</p>
            ) : !logs?.length ? (
              <p className="text-xs text-muted-foreground">No FBR API log rows for this document yet.</p>
            ) : (
              <ul className="space-y-2 text-xs">
                {logs.map((log) => (
                  <li className="rounded-lg border border-border/50 bg-white px-3 py-2" key={log.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">
                        {log.operation} · {log.success ? "OK" : "Failed"}
                        {log.httpStatus != null ? ` · HTTP ${log.httpStatus}` : ""}
                      </span>
                      <span className="text-muted-foreground">{formatDateTime(log.createdAt)}</span>
                    </div>
                    {log.fbrInvoiceNumber ? (
                      <p className="mt-1 text-muted-foreground">FBR number: {log.fbrInvoiceNumber}</p>
                    ) : null}
                    {log.errorMessage ? (
                      <p className="mt-1 text-rose-700">{log.errorMessage}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </td>
        </tr>
      ) : null}
    </>
  );
}

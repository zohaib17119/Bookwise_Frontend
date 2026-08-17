import { createPdfUrl } from "@/components/pdfCreation/createPdfUrl";
import { generateInvoicePdf } from "@/components/pdfCreation/pdf";
import { Button } from "@/components/ui/button";
import { renderEstimateHtml } from "@/features/estimates/api/estimates.api";
import type { Estimate } from "@/features/estimates/types/estimate.types";
import { formatDate } from "@/lib/utils/format";
import { escapeHtml, safeHttpUrl } from "@/lib/utils/html";
import { useEffect, useMemo, useState } from "react";
import Modal from "react-modal";

function pdfDate(value?: string | null): string {
  if (!value) return "-";
  // Prefer calendar date portion when API sends ISO timestamps.
  const dateOnly = value.includes("T") ? value.split("T")[0]! : value;
  return formatDate(dateOnly);
}

function buildEstimatePdfHtml(estimate: Estimate | null | undefined): string {
  const estimateRecord = estimate as unknown as Record<string, unknown>;
  const e = escapeHtml;
  const company = (estimateRecord?.company ?? {}) as Record<string, unknown>;
  const customer = (estimateRecord?.customer ?? {}) as Record<string, unknown>;
  const logoUrl = safeHttpUrl(company.logoUrl);
  const currencyCode = e(estimate?.currencyCode);
  const lines = Array.isArray(estimate?.lines) ? estimate.lines : [];

  const lineRows = lines
    .map((line, index) => {
      const lineRecord = line as unknown as Record<string, unknown>;
      const item = (lineRecord.item ?? {}) as Record<string, unknown>;
      const itemName = item.name ?? lineRecord.itemName ?? "";
      const taxRate = Number.parseFloat(String(lineRecord.taxRate ?? "0"));
      const taxLabel = e(lineRecord.taxName ?? lineRecord.taxCode ?? "");
      const taxCell =
        lineRecord.lineTaxAmount && lineRecord.lineTaxAmount !== 0
          ? `${taxLabel}<br/>${e(Number.isFinite(taxRate) ? taxRate.toFixed(1) : "0")}%<br/>${e(lineRecord.lineTaxAmount)}`
          : "-";

      return `<tr>
        <td>${index + 1}</td>
        <td>${e(itemName)}</td>
        <td>${e(line.description)}</td>
        <td class="num">${e(line.quantity)}</td>
        <td class="num">${e(line.unitPrice)}</td>
        <td class="num">${e(lineRecord.lineSubtotal)}</td>
        <td>${taxCell}</td>
        <td class="num">${e(lineRecord.lineTotal)}</td>
      </tr>`;
    })
    .join("");

  const notes = e(estimate?.notes);
  const companyName = e(company.name);
  const companyAddress = e(company.addressLine1);
  const companyCity = e(
    [company.city, company.state, company.country].filter(Boolean).join(" "),
  );
  const customerName = e(customer.displayName ?? customer.legalName ?? customer.name ?? estimate?.customerName);
  const billingAddress = e(customer.billingAddressLine1);
  const billingCity = e(
    [customer.billingCity, customer.billingState, customer.billingCountry]
      .filter(Boolean)
      .join(" "),
  );

  const totals = (estimate?.totals ?? {}) as Record<string, unknown>;
  const subtotal = e(totals.subtotal ?? estimateRecord.subtotal);
  const taxTotal = e(totals.taxTotal ?? estimateRecord.taxAmount);
  const total = e(totals.total ?? estimateRecord.total);
  const issueDate = e(pdfDate(estimate?.issueDate));
  const expiryDate = e(pdfDate(estimate?.expiryDate));

  // Fragment with invoice-style A4 .page shell. Styles are scoped (not on body)
  // so they apply when html2pdf injects this into a div.
  return `<style>
    .page, .page * { box-sizing: border-box; }
    .page {
      font-family: Arial, sans-serif;
      color: #333;
      width: 210mm;
      max-width: 210mm;
      margin: 0 auto;
      padding: 8mm 6mm;
      overflow: hidden;
      background: #fff;
    }
    .page .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      border-bottom: 2px solid #eee;
      padding-bottom: 8px;
    }
    .page .logo { width: 120px; max-width: 28%; height: auto; }
    .page .company { font-size: 11px; line-height: 1.45; min-width: 0; flex: 1; }
    .page .section {
      padding: 16px 0;
      display: flex;
      justify-content: space-between;
      gap: 12px;
      border-bottom: 2px dotted grey;
    }
    .page .box { width: 48%; font-size: 11px; min-width: 0; overflow-wrap: anywhere; word-break: break-word; }
    .page table {
      width: 100%;
      max-width: 100%;
      margin-top: 16px;
      border-collapse: collapse;
      table-layout: fixed;
    }
    .page table th,
    .page table td {
      border: 1px solid #eee;
      padding: 6px 4px;
      font-size: 9px;
      text-align: left;
      vertical-align: top;
      white-space: normal;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .page table th:nth-child(1),
    .page table td:nth-child(1) { width: 4%; }
    .page table th:nth-child(2),
    .page table td:nth-child(2) { width: 18%; }
    .page table th:nth-child(3),
    .page table td:nth-child(3) { width: 22%; }
    .page table th:nth-child(4),
    .page table td:nth-child(4) { width: 8%; }
    .page table th:nth-child(5),
    .page table td:nth-child(5),
    .page table th:nth-child(6),
    .page table td:nth-child(6),
    .page table th:nth-child(8),
    .page table td:nth-child(8) { width: 11%; }
    .page table th:nth-child(7),
    .page table td:nth-child(7) { width: 15%; }
    .page td.num { text-align: right; }
    .page .totals {
      width: 100%;
      max-width: 100%;
      margin-top: 12px;
      font-size: 11px;
      text-align: right;
      overflow: hidden;
    }
    .page .totals .currency-line {
      margin-bottom: 4px;
      color: #555;
    }
    .page .note {
      margin-top: 12px;
      font-size: 11px;
      padding: 0;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
  </style>
  <div class="page">
    <div class="header">
      <div class="company">
        <h2 style="color:#1d4ed8; font-size:14px; margin:0 0 6px"><b>ESTIMATE / QUOTATION</b></h2>
        <b>${companyName}</b><br />
        ${companyAddress}<br />
        ${companyCity}<br />
        ${e(company.email)}<br>
        ${e(company.phone)}
      </div>
      ${logoUrl ? `<img class="logo" src='${logoUrl}' alt="Company Logo" />` : ""}
    </div>
    <div class="section">
      <div class="box">
        <h4 style="margin:0 0 6px"><b>Quote To</b></h4>
        <div>
          ${customerName}<br />
          ${billingAddress}<br />
          ${billingCity}<br />
          ${e(customer.email)}<br>
          ${e(customer.phone)}
        </div>
      </div>
      <div class="box">
        <b>Estimate Details</b><br>
        Estimate No: ${e(estimate?.estimateNumber)} <br>
        Reference: ${e(estimate?.referenceNumber)} <br>
        Terms: ${e(estimate?.terms)} <br>
        Issue Date: ${issueDate} <br>
        Valid Until: ${expiryDate}
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Product / Service</th>
          <th>Description</th>
          <th>Qty</th>
          <th>Rate</th>
          <th>Amount</th>
          <th>Tax</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${lineRows}
      </tbody>
    </table>
    <div class="totals">
      <div class="currency-line">Currency: ${currencyCode}</div>
      <div>Subtotal: ${currencyCode} ${subtotal}</div>
      <div>Tax: ${currencyCode} ${taxTotal}</div>
      <div><b>Total: ${currencyCode} ${total}</b></div>
    </div>
    <div class="note">${notes}</div>
  </div>`;
}

export default function EstimateView({
  estimate,
  companyId,
}: {
  estimate: Estimate;
  companyId?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const fallbackHtml = useMemo(() => buildEstimatePdfHtml(estimate), [estimate]);
  const fileName = `estimate-${estimate.estimateNumber || estimate.id}.pdf`;

  useEffect(() => {
    Modal.setAppElement("#root");
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setPdfUrl("");
      return;
    }

    let cancelled = false;
    setLoading(true);

    const load = async () => {
      let nextHtml = fallbackHtml;
      if (companyId && estimate.id) {
        try {
          const rendered = await renderEstimateHtml(companyId, estimate.id, "a4");
          if (rendered?.content && rendered.contentType?.includes("html")) {
            nextHtml = rendered.content;
          }
        } catch {
          // Fall back to local HTML when render API/template is unavailable.
        }
      }
      if (cancelled) return;
      setHtml(nextHtml);
      const url = await createPdfUrl(nextHtml);
      if (!cancelled) setPdfUrl(url);
      setLoading(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, companyId, estimate.id, fallbackHtml]);

  return (
    <div>
      <Button variant="secondary" onClick={() => setIsOpen(true)}>
        Preview estimate PDF
      </Button>

      <Modal
        isOpen={isOpen}
        onRequestClose={() => setIsOpen(false)}
        shouldCloseOnOverlayClick
        className="absolute left-1/2 top-1/2 w-[95vw] h-[90vh] max-w-6xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl outline-none overflow-hidden"
        overlayClassName="fixed inset-0 z-[9999] bg-black/60"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Estimate / Quotation Preview</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-2xl text-gray-500 hover:text-black"
            type="button"
          >
            ×
          </button>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-muted-foreground">Preparing estimate PDF…</p>
        ) : pdfUrl ? (
          <div style={{ width: "100%", height: "80%", marginTop: 10 }}>
            <iframe src={pdfUrl} width="100%" height="100%" title="Estimate Preview" />
          </div>
        ) : null}

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="secondary"
            onClick={() => generateInvoicePdf(html || fallbackHtml, fileName)}
          >
            Download estimate
          </Button>
          <Button variant="secondary" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
}

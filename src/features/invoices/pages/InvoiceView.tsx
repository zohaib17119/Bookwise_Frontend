import { createPdfUrl } from "@/components/pdfCreation/createPdfUrl";
import { generateInvoicePdf } from "@/components/pdfCreation/pdf";
import { Button } from "@/components/ui/button";
import { renderInvoiceHtml } from "@/features/settings/api/invoice-templates.api";
import { escapeHtml, safeHttpUrl } from "@/lib/utils/html";
import { useEffect, useMemo, useState } from "react";
import Modal from "react-modal";

import type { Invoice } from "@/features/invoices/types/invoice.types";

function buildInvoicePdfHtml(invoice: Invoice | null | undefined): string {
  const invoiceRecord = invoice as unknown as Record<string, unknown>;
  const e = escapeHtml;
  const company = (invoiceRecord?.company ?? {}) as Record<string, unknown>;
  const customer = (invoiceRecord?.customer ?? {}) as Record<string, unknown>;
  const logoUrl = safeHttpUrl(company.logoUrl);
  const currencyCode = e(invoice?.currencyCode);
  const lines = Array.isArray(invoice?.lines) ? invoice.lines : [];

  const lineRows = lines
    .map((line, index) => {
      const lineRecord = line as unknown as Record<string, unknown>;
      const item = (lineRecord.item ?? {}) as Record<string, unknown>;
      const taxRate = Number.parseFloat(String(lineRecord.taxRate ?? "0"));
      const taxCell =
        lineRecord.lineTaxAmount && lineRecord.lineTaxAmount !== 0
          ? `${e(lineRecord.taxName)}@ ${e(Number.isFinite(taxRate) ? taxRate.toFixed(1) : "0")}% ${currencyCode} ${e(lineRecord.lineTaxAmount)}`
          : "-";

      return `<tr>
        <td>${index + 1}</td>
        <td>${e(item.name)}</td>
        <td>${e(line.description)}</td>
        <td>${e(line.quantity)}</td>
        <td>${currencyCode} ${e(line.unitPrice)}</td>
        <td>${currencyCode} ${e(lineRecord.lineSubtotal)}</td>
        <td>${taxCell}</td>
        <td>${currencyCode} ${e(lineRecord.lineTotal)}</td>
      </tr>`;
    })
    .join("");

  const notes = e(invoice?.notes);
  const companyName = e(company.name);
  const companyAddress = e(company.addressLine1);
  const companyCity = e(
    [company.city, company.state, company.country].filter(Boolean).join(" "),
  );
  const customerName = e(customer.displayName ?? customer.legalName ?? customer.name);
  const billingAddress = e(customer.billingAddressLine1);
  const billingCity = e(
    [customer.billingCity, customer.billingState, customer.billingCountry]
      .filter(Boolean)
      .join(" "),
  );

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice ${e(invoice?.invoiceNumber)}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 30px; color: #333; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #eee; padding-bottom: 5px; }
    .logo { width: 180px; }
    .company { font-size: 12px; line-height: 1.5; }
    .section { padding-top: 20px; padding-bottom: 40px; display: flex; justify-content: space-between; border-bottom: 2px dotted grey; }
    .box { width: 48%; font-size: 12px; }
    table { width: 100%; border: 1px solid grey; margin-top: 20px; border-collapse: collapse; }
    table th, table td { border: 1px solid #eee; padding: 12px; font-size: 11px; text-align: left; }
    .note { margin-top: 0; font-size: 12px; padding: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company">
      <h2 style="color:#1d4ed8; font-size:14px"><b>INVOICE</b></h2>
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
      <h4><b>Bill To</b></h4>
      <div>
        ${customerName}<br />
        ${billingAddress}<br />
        ${billingCity}<br />
        ${e(customer.email)}<br>
        ${e(customer.phone)}
      </div>
    </div>
    <div class="box">
      <b>Invoice Details</b><br>
      Invoice No: ${e(invoice?.invoiceNumber)} <br>
      Terms: ${e(invoice?.terms)} <br>
      Invoice Date: ${e(invoice?.issueDate)} <br>
      Due Date: ${e(invoice?.dueDate)}
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
  <div class="note">${notes}</div>
</body>
</html>`;
}

export default function InvoiceView({
  invoice,
  companyId,
}: {
  invoice: Invoice;
  companyId?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const fallbackHtml = useMemo(() => buildInvoicePdfHtml(invoice), [invoice]);

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
      if (companyId && invoice.id) {
        try {
          const rendered = await renderInvoiceHtml(companyId, invoice.id, "a4");
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
  }, [isOpen, companyId, invoice.id, fallbackHtml]);

  return (
    <div>
      <Button variant="secondary" onClick={() => setIsOpen(true)}>
        Preview Invoice
      </Button>

      <Modal
        isOpen={isOpen}
        onRequestClose={() => setIsOpen(false)}
        shouldCloseOnOverlayClick
        className="absolute left-1/2 top-1/2 w-[95vw] h-[90vh] max-w-6xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl outline-none overflow-hidden"
        overlayClassName="fixed inset-0 z-[9999] bg-black/60"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Invoice Preview</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-2xl text-gray-500 hover:text-black"
            type="button"
          >
            ×
          </button>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-muted-foreground">Preparing invoice PDF…</p>
        ) : pdfUrl ? (
          <div style={{ width: "100%", height: "80%", marginTop: 10 }}>
            <iframe src={pdfUrl} width="100%" height="100%" title="Invoice Preview" />
          </div>
        ) : null}

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="secondary"
            onClick={() => generateInvoicePdf(html || fallbackHtml, "invoice.pdf")}
          >
            Download Invoice
          </Button>
          <Button variant="secondary" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
}

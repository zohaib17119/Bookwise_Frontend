import { createPdfUrl } from "@/components/pdfCreation/createPdfUrl";
import { generateInvoicePdf } from "@/components/pdfCreation/pdf";
import { Button } from "@/components/ui/button";
import { escapeHtml, safeHttpUrl } from "@/lib/utils/html";
import { useEffect, useMemo, useState } from "react";
import Modal from "react-modal";

function buildInvoicePdfHtml(invoice: Record<string, unknown> | null | undefined): string {
  const e = escapeHtml;
  const company = (invoice?.company ?? {}) as Record<string, unknown>;
  const customer = (invoice?.customer ?? {}) as Record<string, unknown>;
  const logoUrl = safeHttpUrl(company.logoUrl);
  const currencyCode = e(invoice?.currencyCode);
  const lines = Array.isArray(invoice?.lines) ? invoice.lines : [];

  const lineRows = lines
    .map((line: Record<string, unknown>, index: number) => {
      const item = (line?.item ?? {}) as Record<string, unknown>;
      const taxRate = Number.parseFloat(String(line?.taxRate ?? "0"));
      const taxCell =
        line?.lineTaxAmount && line?.lineTaxAmount !== 0
          ? `${e(line?.taxName)}@ ${e(Number.isFinite(taxRate) ? taxRate.toFixed(1) : "0")}% ${currencyCode} ${e(line?.lineTaxAmount)}`
          : "-";

      return `<tr>
        <td>${index + 1}</td>
        <td>${e(item?.name)}</td>
        <td>${e(line.description)}</td>
        <td>${e(line.quantity)}</td>
        <td>${currencyCode} ${e(line.unitPrice)}</td>
        <td>${currencyCode} ${e(line?.lineSubtotal)}</td>
        <td>${taxCell}</td>
        <td>${currencyCode} ${e(line?.lineTotal)}</td>
      </tr>`;
    })
    .join("");

  const notes = invoice?.notes ? `Note: ${e(invoice.notes)}` : "";

  return `
<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8" />
  <title>Invoice</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    body {
      font-family: Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      text-rendering: geometricPrecision;
      padding: 30px;
      color: #333;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #eee;
      padding-bottom: 5px;
    }

    .logo {
      width: 180px;
    }

    .company {
      font-size: 12px;
      line-height: 1.5;
    }

    .section {
      padding-top: 20px;
      padding-bottom: 40px;
      display: flex;
      justify-content: space-between;
      border-bottom: 2px dotted grey;
    }
    .section2 {
      padding-top: 40px;
      padding-bottom: 20px;
      display: flex;
    }

    .box {
      width: 48%;
      font-size: 12px;
    }

    table {
      width: 100%;
      border: 1px solid grey;
      margin-top: 20px;
    }

    table th,
    table td {
      border: 1px solid #eee;
      padding: 12px;
      font-size: 11px;
      text-align: left;
    }

    .summary {
      margin-top: 20px;
      width: 100%;
      display: flex;
      justify-content: flex-end;
    }

    .note {
      margin-top: 0px;
      font-size: 12px;
      padding: 30px;
    }

    .main-bod {
      padding: 30px;
    }

    .main-bod-second {
      padding: 0px 30px 5px;
      background-color: #EBF4FB;
    }
  </style>
</head>

<body>
  <div>
    <div class="main-bod">
      <div class="header">
        <div class="company">
          <h2 style="color:#1d4ed8; font-size:14px"><b>INVOICE</b></h2>
          <b>${e(company.name)}</b><br />
          ${e(company.addressLine1)}<br />
          ${e(company.city)} ${e(company.state)} ${e(company.Country ?? company.country)}<br />
          ${e(company.email)}<br>
          ${e(company.phone)}
        </div>
        ${logoUrl ? `<img class="logo" src="${logoUrl}" alt="Company Logo" />` : ""}
      </div>
    </div>
  </div>

  <div class="main-bod-second">
    <div class="section">
      <div class="box">
        <h4><b>Bill To</b></h4>
        <div>
          ${e(customer.displayName)}<br />
          ${e(customer.billingAddressLine1)}<br />
          ${e(customer.billingCity)} ${e(customer.billingState)} ${e(customer.billingCountry)}<br />
          ${e(customer.email)}<br>
          ${e(customer.phone)}
        </div>
      </div>
      <div class="box">
        <h4><b>Ship To</b></h4>
        <div>
          ${e(customer.displayName)}<br />
          ${e(customer.shippingAddressLine1)}<br />
          ${e(customer.shippingCity)} ${e(customer.shippingState)} ${e(customer.shippingCountry)}<br />
          ${e(customer.email)}<br>
          ${e(customer.phone)}
        </div>
      </div>
    </div>

    <div class="section2">
      <div class="box">
        <b>Invoice Details</b><br>
        Invoice No: ${e(invoice?.invoiceNumber)} <br>
        Terms: ${e(invoice?.terms)} <br>
        Invoice Date: ${e(invoice?.issueDate)} <br>
        Due Date: ${e(invoice?.dueDate)}
      </div>
    </div>
  </div>

  <div class="main-bod">
    <table bordered>
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
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td><b>${currencyCode} ${e(invoice?.subtotal)}</b></td>
        <td><b>${currencyCode} ${e(invoice?.taxAmount)}</b></td>
        <td><b>${currencyCode} ${e(invoice?.total)}</b></td>
      </tbody>
    </table>
    <div class="summary"></div>
  </div>

  <div class="note">${notes}</div>
</body>

</html>`;
}

export default function InvoiceView({ invoice }: { invoice: Record<string, unknown> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const pdfInvoice = useMemo(() => buildInvoicePdfHtml(invoice), [invoice]);

  useEffect(() => {
    Modal.setAppElement("#root");
  }, []);

  useEffect(() => {
    if (isOpen) {
      void createPdfUrl(pdfInvoice).then(setPdfUrl);
    } else {
      setPdfUrl("");
    }
  }, [isOpen, pdfInvoice]);

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

        {pdfUrl ? (
          <div style={{ width: "100%", height: "80%", marginTop: 10 }}>
            <iframe src={pdfUrl} width="100%" height="100%" title="Invoice Preview" />
          </div>
        ) : null}

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="secondary"
            onClick={() => generateInvoicePdf(pdfInvoice, "invoice.pdf")}
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

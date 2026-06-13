
import { createPdfUrl } from "@/components/pdfCreation/createPdfUrl";
import { generateInvoicePdf } from "@/components/pdfCreation/pdf";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import Modal from "react-modal";

export default function InvoiceView({invoice}) {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        Modal.setAppElement("#root");
    }, []);
console.log("invoice",invoice)
    const pdfInvoice = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice</title>
  <link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
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
      padding-bottom: 20px;
    }

    .logo {
      width: 180px;
    }

    .company {
      font-size: 14px;
      line-height: 1.5;
    }

    .section {
      margin-top: 20px;
      display: flex;
      justify-content: space-between;
    }

    .box {
      width: 48%;
      font-size: 14px;
    }

    .invoice-details {
      margin-top: 20px;
      background: #f5f7fb;
      padding: 15px;
      border-radius: 6px;
    }

    table {
      width: 100%;
    
    border: 1px solid grey;
      margin-top: 20px;
    }

    table th, table td {
      border: 1px solid #eee;
      padding: 12px;
      font-size: 12px;
      text-align: left;
    }

    .right {
      text-align: right;
    }

    .summary {
      margin-top: 20px;
      width: 100%;
      display: flex;
      justify-content: flex-end;
    }

    .summary-box {
      width: 300px;
      font-size: 14px;
    }

    .total {
      font-size: 18px;
      font-weight: bold;
      margin-top: 10px;
    }

    .note {
      margin-top: 20px;
      font-size: 14px;
    }
.main-bod{
padding: 30px;
}
  </style>
</head>

<body>
<div class="main-bod">

  <!-- HEADER -->
  <div class="header">
    <div>
      <h2 style="color:#1d4ed8;">INVOICE</h2>
      <div class="company">
        Zee Holdings<br>
        A - 10 Block A North Nazimabad<br>
        Karachi, Pakistan<br>
        Karachi, Sindh 74700
      </div>
      <div class="company">
        zohaibzafar1117@gmail.com<br>
        +923168939741
      </div>
    </div>

    <img class="logo" src="data:image/jpeg;base64,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" />
  </div>

  <!-- BILL / SHIP -->
  <div class="section">
    <div class="box">
      <h4>Bill To</h4>
      <div>
        abcd ab cd ss kansk<br>
        kmkmmlkmsalks<br>
        A - 10 Block A North Nazimabad Karachi<br>
        Pakistan
      </div>
    </div>

    <div class="box">
      <h4>Ship To</h4>
      <div>
        abcd ab cd ss kansk<br>
        kmkmmlkmsalks<br>
        A - 10 Block A North Nazimabad Karachi<br>
        Pakistan
      </div>
    </div>
  </div>

  <!-- INVOICE DETAILS -->
  <div class="invoice-details">
    <b>Invoice No:</b> 1001 <br>
    <b>Terms:</b> Net 15 <br>
    <b>Invoice Date:</b> 11/06/2026 <br>
    <b>Due Date:</b> 28/06/2026
  </div>

  <!-- TABLE -->
  <table bordered >
    <thead>
      <tr>
        <th>#</th>
        <th>Product / Service</th>
        <th>Description</th>
        <th>Qty</th>
        <th>Rate</th>
        <th>Amount</th>
        <th>Tax</th>
      </tr>
    </thead>

    <tbody>
      <tr>
        <td>1</td>
        <td>abcd</td>
        <td>10000</td>
        <td>1000</td>
        <td>Rs 1000000000000000000000</td>
        <td>Rs 10,00,000.00</td>
        <td>GST @ 15% 15000</td>
      </tr>
      
    </tbody>
  </table>

  <!-- SUMMARY -->
  <div class="summary">
    <div class="summary-box">
      <div>Subtotal: Rs 10,000,000.00</div>
      <div>GST @ 15%: Rs 1,500,000.00</div>
      <div class="total">Total: Rs 11,500,000.00</div>
    </div>
  </div>

  <!-- NOTE -->
  <div class="note">
    <b>Payment Options</b><br>
    Note to customer: ye note hai aksdjknknasdkjnasjdn <br />
    Note to customer: ye note hai aksdjknknasdkjnasjdn <br />
    Note to customer: ye note hai aksdjknknasdkjnasjdn <br />
    Note to customer: ye note hai aksdjknknasdkjnasjdn <br />
  </div>

</div>
</body>
</html>`
    const [pdfUrl, setPdfUrl] = useState("");
    useEffect(() => {
        if (isOpen) {
            handlePreview()
        } else {
            setPdfUrl("")
        }
    }, [isOpen])

    const handlePreview = async () => {
        const url = await createPdfUrl(pdfInvoice);
        setPdfUrl(url);
    };
    return (
        <div >
            <Button asChild variant="secondary"
                onClick={() => setIsOpen(true)}>
                Preview Invoice
            </Button>

            <Modal
                isOpen={isOpen}
                onRequestClose={() => setIsOpen(false)}
                shouldCloseOnOverlayClick
                className="absolute left-1/2 top-1/2 w-[95vw] h-[90vh] max-w-6xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl outline-none overflow-hidden"
                overlayClassName="fixed inset-0 z-[9999] bg-black/60"
            >
                <div className="flex items-center bg-danger justify-between">
                    <h2 className="text-2xl font-bold">Modal Title</h2>
                    {/* <button
                        onClick={() =>
                            generateInvoicePdf(pdfInvoice, "invoice-199999999.pdf")}>
                        Download Invoice
                    </button> */}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-2xl text-gray-500 hover:text-black"
                    >
                        ×
                    </button>
                </div>

                {/* <p className="mt-4 text-gray-600">
                    Ye modal poori screen ke upar overlay ke saath open hoga.
                </p> */}
                {/* <button onClick={handlePreview}>
        Preview Invoice
      </button> */}

                {pdfUrl && (
                    <div
                        style={{
                            width: "100%",
                            height: "80%",
                            marginTop: 10,
                        }}
                    >
                        <iframe
                            src={pdfUrl}
                            width="100%"
                            height="100%"
                            title="Invoice Preview"
                        />
                    </div>
                )}
                <div className="flex items-center pt-2 bg-danger justify-between">
                    <Button asChild variant="secondary"
                        onClick={() =>
                            generateInvoicePdf(pdfInvoice, "invoice-199999999.pdf")}>
                        Download Invoice
                    </Button>
                    <Button asChild variant="secondary"
                        onClick={() => setIsOpen(false)}
                    // className="rounded-lg border px-4 py-2"
                    >
                        Close
                    </Button>

                </div>
            </Modal>
        </div>
    );
}
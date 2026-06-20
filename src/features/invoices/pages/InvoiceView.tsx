
import { createPdfUrl } from "@/components/pdfCreation/createPdfUrl";
import { generateInvoicePdf } from "@/components/pdfCreation/pdf";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import Modal from "react-modal";

export default function InvoiceView({ invoice }) {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        Modal.setAppElement("#root");
    }, []);
    console.log("invoice", invoice)
  const pdfInvoice = `
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
    //   justify-content: space-between;
    //   border-bottom: 2px dotted grey;
    }

    .box {
      width: 48%;
      font-size: 12px;
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

    table th,
    table td {
      border: 1px solid #eee;
      padding: 12px;
      font-size: 11px;
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
      font-size: 12px;
    }

    .total {
      font-size: 18px;
      font-weight: bold;
      margin-top: 10px;
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

  <!-- HEADER -->
  <div>
    <div class="main-bod">
      <div class="header">
        <div class="company">
          <h2 style="color:#1d4ed8; font-size:14px"><b>INVOICE</b></h2>

          <b>${invoice?.company?.name}</b><br />
          ${invoice?.company?.addressLine1}<br />
          ${invoice?.company?.city} ${invoice?.company?.state} ${invoice?.company?.Country}<br />
          ${invoice?.company?.email}<br>
          ${invoice?.company?.phone}
        </div>
        <img class="logo" src='${invoice?.company?.logoUrl}' alt="Company Logo" />
      </div>

    </div>
  </div>

  <!-- BILL / SHIP -->
  <div class="main-bod-second">
    <div class="section">
        <div class="box">
                <h4><b>Bill To</b></h4>

            <div>
            ${invoice?.customer?.displayName}<br />
            ${invoice?.customer?.billingAddressLine1}<br />
            ${invoice?.customer?.billingCity} ${invoice?.customer?.billingState}
            ${invoice?.customer?.billingCountry}<br />
            ${invoice?.customer?.email}<br>
            ${invoice?.customer?.phone}
            </div>
         </div>
        <div class="box">
        <h4><b>Ship To</b></h4>
            <div>
            ${invoice?.customer?.displayName}<br />
            ${invoice?.customer?.shippingAddressLine1}<br />
            ${invoice?.customer?.shippingCity} ${invoice?.customer?.shippingState}
            ${invoice?.customer?.shippingCountry}<br />
            ${invoice?.customer?.email}<br>
            ${invoice?.customer?.phone}
            </div>
         </div>
    </div>
    
    <!-- INVOICE DETAILS -->
    <div class="section2">
    <div class="box">
      <b>Invoice Details</b><br>
      Invoice No: ${invoice?.invoiceNumber} <br>
      Terms: ${invoice?.terms} <br>
      Invoice Date: ${invoice?.issueDate} <br>
      Due Date: ${invoice?.dueDate}
    </div>
    </div>
  </div>

  <!-- TABLE -->
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
    ${invoice.lines.map((line : any, index : number) =>`<tr>
        <td>${index + 1}</td>
        <td>${line?.item?.name}</td>
        <td>${line.description}</td>
        <td>${line.quantity}</td>
        <td>${line.unitPrice}</td>
        <td>${line?.lineSubtotal}</td>
        <td>${line?.lineTaxAmount && line?.lineTaxAmount !== 0 ? (line?.taxName + "@ " + parseFloat(line?.taxRate).toFixed(1) +"% " +line?.lineTaxAmount) : "-"}</td>
        <td>${line?.lineTotal}</td>
      </tr>`).join("")
      }
<td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td><b>${invoice?.subtotalBase}</b></td>
        <td><b>${invoice?.taxAmountBase}</b></td>
        <td><b>${invoice?.totalBase}</b></td>
    </tbody>
  </table>

  <!-- SUMMARY -->
  <div class="summary">
   
  </div>
  </div>

  <!-- NOTE -->
  <div class="note">
    
    ${invoice?.notes ? "Note:" + " " + invoice?.notes : ""}
  </div>

</body>

</html>`
    {/* <div class="box">
      <h4>Ship To</h4>
      <div>
        abcd ab cd ss kansk<br>
        kmkmmlkmsalks<br>
        A - 10 Block A North Nazimabad Karachi<br>
        Pakistan
      </div>
    </div> */}
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
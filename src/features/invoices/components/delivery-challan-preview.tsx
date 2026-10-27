import { createPdfUrl } from "@/components/pdfCreation/createPdfUrl";
import { generateInvoicePdf } from "@/components/pdfCreation/pdf";
import { Button } from "@/components/ui/button";
import { renderDeliveryChallanHtml } from "@/features/invoices/api/delivery-challans.api";
import { useEffect, useState } from "react";
import Modal from "react-modal";

export function DeliveryChallanPreview({
  companyId,
  invoiceId,
  dcId,
  challanNumber,
  label = "Print",
}: {
  companyId: string;
  invoiceId: string;
  dcId: string;
  challanNumber: string;
  label?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Modal.setAppElement("#root");
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setPdfUrl("");
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const rendered = await renderDeliveryChallanHtml(companyId, invoiceId, dcId);
        if (cancelled) return;
        if (!rendered?.content) {
          setError("Could not render delivery challan");
          setLoading(false);
          return;
        }
        setHtml(rendered.content);
        const url = await createPdfUrl(rendered.content);
        if (!cancelled) setPdfUrl(url);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load preview");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, companyId, invoiceId, dcId]);

  return (
    <>
      <Button size="sm" type="button" variant="secondary" onClick={() => setIsOpen(true)}>
        {label}
      </Button>

      <Modal
        isOpen={isOpen}
        onRequestClose={() => setIsOpen(false)}
        shouldCloseOnOverlayClick
        className="absolute left-1/2 top-1/2 w-[95vw] h-[90vh] max-w-6xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl outline-none overflow-hidden"
        overlayClassName="fixed inset-0 z-[9999] bg-black/60"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Delivery challan {challanNumber}</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-2xl text-gray-500 hover:text-black"
            type="button"
          >
            ×
          </button>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-muted-foreground">Preparing delivery challan PDF…</p>
        ) : error ? (
          <p className="mt-6 text-sm text-destructive">{error}</p>
        ) : pdfUrl ? (
          <div style={{ width: "100%", height: "80%", marginTop: 10 }}>
            <iframe src={pdfUrl} width="100%" height="100%" title="Delivery challan preview" />
          </div>
        ) : null}

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="secondary"
            disabled={!html}
            onClick={() => generateInvoicePdf(html, `delivery-challan-${challanNumber}.pdf`)}
          >
            Download
          </Button>
          <Button variant="secondary" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </>
  );
}

import html2pdf from "html2pdf.js";

type PdfContainerStyle = CSSStyleDeclaration & {
  webkitFontSmoothing?: string;
};

export const generateInvoicePdf = async (
  htmlString: string,
  fileName = "invoice.pdf"
) => {
  const element = document.createElement("div");
  element.innerHTML = htmlString;
  element.style.background = "#ffffff";
  element.style.color = "#111";
  element.style.width = "210mm";
  element.style.maxWidth = "210mm";
  element.style.overflow = "hidden";
  element.style.boxSizing = "border-box";

  const elementStyle = element.style as PdfContainerStyle;
  elementStyle.fontFamily = "Arial, sans-serif";
  elementStyle.webkitFontSmoothing = "antialiased";
  element.style.textRendering = "geometricPrecision";

  const options = {
    // Padding comes from HTML .page shell (invoice-style A4), not jsPDF margins.
    margin: 0,
    filename: fileName,
    image: {
      type: "jpeg" as const,
      quality: 1,
    },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      backgroundColor: "#ffffff",
      windowWidth: 794,
    },
    jsPDF: {
      unit: "mm" as const,
      format: "a4" as const,
      orientation: "portrait" as const,
    },
  };

  await html2pdf().set(options).from(element).save();
};

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

 const options = {
  margin: 10,
  filename: fileName,

  image: {
    type: "jpeg" as const,
    quality: 1,
  },

  html2canvas: {
    scale: 4,
    useCORS: true,
    letterRendering: true,
  },

  jsPDF: {
    unit: "mm" as const,
    format: "a4" as const,
    orientation: "portrait" as const,
  },
};

  await html2pdf().set(options).from(element).save();
};

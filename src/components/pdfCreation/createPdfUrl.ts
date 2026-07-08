import html2pdf from "html2pdf.js";

type PdfContainerStyle = CSSStyleDeclaration & {
  webkitFontSmoothing?: string;
};

export const createPdfUrl = async (
  htmlString: string
): Promise<string> => {
  const container = document.createElement("div");

  container.innerHTML = htmlString;

  container.style.background = "#ffffff";
  container.style.color = "#111";
  container.style.width = "794px";

  const containerStyle = container.style as PdfContainerStyle;
  containerStyle.fontFamily = "Arial, sans-serif";
  containerStyle.webkitFontSmoothing = "antialiased";
  container.style.textRendering = "geometricPrecision";

  document.body.appendChild(container);

  const pdfBlob = await html2pdf()
    .from(container)
    .set({
      image: {
        type: "jpeg" as const,
        quality: 1,
      },

      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        letterRendering: true,
      },

      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      },
    })
    .outputPdf("blob");

  document.body.removeChild(container);

  return URL.createObjectURL(pdfBlob);
};

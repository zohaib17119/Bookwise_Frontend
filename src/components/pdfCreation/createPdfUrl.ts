import html2pdf from "html2pdf.js";

export const createPdfUrl = async (
  htmlString: string
): Promise<string> => {
  const container = document.createElement("div");

  container.innerHTML = htmlString;

  // 👇 light improvements (safe, no break risk)
  container.style.background = "#ffffff";
  container.style.color = "#111";
  container.style.width = "794px"; // A4 width fix (IMPORTANT but safe)

  // 👇 smoother text rendering
  container.style.fontFamily = "Arial, sans-serif";
  container.style.webkitFontSmoothing = "antialiased";
  container.style.textRendering = "geometricPrecision";

  document.body.appendChild(container);

  const pdfBlob = await html2pdf()
    .from(container)
    .set({
      image: {
        type: "jpeg",
        quality: 1,
      },

      html2canvas: {
        scale: 2, // SAFE (don’t increase too much warna break ho jata hai)
        useCORS: true,
        backgroundColor: "#ffffff",
        letterRendering: true, // 👈 helps text sharpness
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
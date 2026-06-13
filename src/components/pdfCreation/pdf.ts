import html2pdf from "html2pdf.js";

export const generateInvoicePdf = async (
  htmlString: string,
  fileName = "invoice.pdf"
) => {
  const element = document.createElement("div");

  element.innerHTML = htmlString;

 const options = {
  margin: 10,
  filename: "invoice.pdf",

  image: {
    type: "jpeg",
    quality: 1,
  },

  html2canvas: {
    scale: 4, // default 1 hota hai
    useCORS: true,
    letterRendering: true,
  },

  jsPDF: {
    unit: "mm",
    format: "a4",
    orientation: "portrait",
  },
};

  await html2pdf().set(options).from(element).save();
};
import { PDFDocument, StandardFonts, rgb, type PDFPage } from "pdf-lib";

import { wrapText } from "@/lib/pdf-text";

export type ReceiptPdfInput = {
  receiptNumber: string;
  paidAt: Date;
  doctorName: string;
  hospitalName?: string;
  address?: string;
  surveyFormNo: string;
  productName: string;
  amount: number;
  tdsAmount: number;
  netAmount: number;
  transactionRefNumber: string;
  paidToName: string;
};

const PAGE_SIZE: [number, number] = [595.28, 841.89]; // A4
const MARGIN = 50;
const BODY_SIZE = 11;
const LINE_GAP = 16;

function formatDate(date: Date) {
  const two = (n: number) => n.toString().padStart(2, "0");
  return `${two(date.getDate())}.${two(date.getMonth() + 1)}.${date.getFullYear()}`;
}

function formatAmount(value: number) {
  return value.toLocaleString("en-IN");
}

export async function generateReceiptPdf(
  input: ReceiptPdfInput
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const contentWidth = PAGE_SIZE[0] - MARGIN * 2;

  let page: PDFPage = pdfDoc.addPage(PAGE_SIZE);
  let y = PAGE_SIZE[1] - MARGIN;

  function ensureSpace(needed: number) {
    if (y - needed < MARGIN) {
      page = pdfDoc.addPage(PAGE_SIZE);
      y = PAGE_SIZE[1] - MARGIN;
    }
  }

  function drawLine(
    text: string,
    { size = BODY_SIZE, bold = false, gap = LINE_GAP }: { size?: number; bold?: boolean; gap?: number } = {}
  ) {
    const useFont = bold ? boldFont : font;
    const lines = wrapText(text, useFont, size, contentWidth);
    for (const line of lines) {
      ensureSpace(gap);
      page.drawText(line, { x: MARGIN, y, size, font: useFont, color: rgb(0, 0, 0) });
      y -= gap;
    }
  }

  // Header
  drawLine(`Payment Receipt No: ${input.receiptNumber}`, { bold: true });
  drawLine(`Date – ${formatDate(input.paidAt)}`);
  y -= 6;

  drawLine("To,");
  drawLine(`Dr. ${input.doctorName},`);
  if (input.hospitalName) drawLine(`${input.hospitalName},`);
  if (input.address) drawLine(`${input.address},`);
  y -= 6;

  drawLine(`Dear Dr. ${input.doctorName},`);
  y -= 4;

  drawLine(
    `We have receipt of Market Survey Form no: ${input.surveyFormNo} For Product ${input.productName}.`
  );
  y -= 4;

  drawLine(
    "We Value the professional Service in Conduct of Study. We Appreciate Your Medical Expertise to Needy Patients And look Forword for your valuable support and suggestions for such Scientific activities in future."
  );
  y -= 4;

  drawLine(
    `We Have done the payment of Rs. ${formatAmount(input.netAmount)}/- via NEFT /RTGS with REF No. ${input.transactionRefNumber} Dated ${formatDate(input.paidAt)} in favouring name of ${input.paidToName}.`
  );
  y -= 4;

  drawLine(
    `( Gross Amount: Rs. ${formatAmount(input.amount)}/-, Less: TDS Rs.${formatAmount(input.tdsAmount)}/- Net Amount : Rs.${formatAmount(input.netAmount)}/-)`
  );
  y -= 4;

  drawLine("Please Acknowledge the receipt.");
  y -= 4;
  drawLine("With warm regards,");
  drawLine("For NBC Pedia (A Div. Of Indo NBC Laboratories Pvt. Ltd.)");

  y -= 30;
  drawLine("Authorized Signatory");
  y -= 10;

  drawLine(
    `PS: NBC Pedia (A Div. Of Indo NBC Laboratories Pvt. Ltd.) Does not expect any preference in prescription / Recommendation for ${input.productName}. Or any other product in consideration of fees paid.`,
    { size: 9 }
  );

  y -= 10;
  ensureSpace(90);
  const boxTop = y;
  const boxHeight = 90;
  page.drawRectangle({
    x: MARGIN,
    y: boxTop - boxHeight,
    width: contentWidth,
    height: boxHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  y -= 16;
  const boxX = MARGIN + 10;
  page.drawText("Received By :", {
    x: boxX,
    y,
    size: BODY_SIZE,
    font,
    color: rgb(0, 0, 0),
  });
  y -= 28;
  page.drawText("Stamp And Signature:", {
    x: boxX,
    y,
    size: BODY_SIZE,
    font,
    color: rgb(0, 0, 0),
  });
  y -= 28;
  page.drawText(`Client Name : Dr. ${input.doctorName}`, {
    x: boxX,
    y,
    size: BODY_SIZE,
    font,
    color: rgb(0, 0, 0),
  });

  return pdfDoc.save();
}

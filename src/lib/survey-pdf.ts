import { PDFDocument, StandardFonts, rgb, type PDFPage } from "pdf-lib";

import { wrapText } from "@/lib/pdf-text";

export type SurveyPdfInput = {
  formNo: string;
  productName: string;
  productComposition: string;
  specialClaim?: string;
  doctorName: string;
  address: string;
};

const PAGE_SIZE: [number, number] = [595.28, 841.89]; // A4
const MARGIN = 50;
const BODY_SIZE = 10.5;
const LINE_GAP = 15;

type Question = {
  text: string;
  options?: string[];
  blankLines?: number;
};

function buildQuestions(input: SurveyPdfInput): Question[] {
  const { productName, productComposition, specialClaim } = input;

  const questions: Question[] = [
    {
      text: "Years of Clinical Practice:",
      options: ["0-5 Yrs", "6-10 Yrs", "11-20 Yrs", "21-30 Years", ">30 Yrs"],
    },
    {
      text: "Geographical Practice Area:",
      options: ["Urban", "Semi-Urban", "Rural"],
    },
    {
      text: "How many Paediatric Patients with Dry Cough do you generally treat in a month?",
      options: ["25-50", "51-100", "101-200", "201-400", "Others, please specify: _______"],
    },
    {
      text: "What are the common causes of Cough among your Patients?",
      options: [
        "Tract Infections",
        "Nasal Drip",
        "Drug Induced",
        "Allergy",
        "Environmental Irritants (Dust / Pollution / Smoke)",
        "Others, please specify: _______",
      ],
    },
    {
      text: "Which category of Cough cases (in Children) do you mostly observe in your routine Practice?",
      options: ["Dry Cough", "Productive Cough", "Mixed type"],
    },
    {
      text: "In which part of the year/season do you observe most cases of Dry Cough in Children?",
      options: ["Winter", "Monsoon / Summer", "Seasonal change", "Throughout the year"],
    },
    {
      text: "What are the major challenges in treating Paediatric Patients with Dry Cough?",
      options: [
        "Self-medication",
        "Irritation-induced Cough relapse",
        "Lack of fast relief",
        "Underlying unknown causes",
        "Others, please specify: _______",
      ],
    },
    {
      text: `Do you prescribe ${productName} [${productComposition}] in Dry Cough?`,
      options: ["Yes", "No"],
    },
    {
      text: `What is the usual duration of treatment you recommend for Patients with Dry Cough using ${productName}?`,
      options: ["Upto 1 Week", "2-3 Weeks", "3-4 Weeks", "More than 4 Weeks"],
    },
  ];

  if (specialClaim) {
    questions.push({
      text: `Are you aware that ${productName} contains ${specialClaim}?`,
      options: ["Yes", "No"],
    });
  }

  questions.push(
    {
      text: `How do you rate the Patient Compliance with ${productName} in Dry Cough treatment?`,
      options: ["Excellent", "Very Good", "Good", "Fair"],
    },
    {
      text: `How do you rate the Efficacy of ${productName} in Treating Dry Cough?`,
      options: ["Excellent", "Very Good", "Good", "Fair", "Poor"],
    },
    {
      text: `Have you observed any Side Effects in Paediatric Patients while using ${productName}? (if Yes, kindly elaborate)`,
      blankLines: 2,
    },
    {
      text: `Please provide your overall feedback on ${productName} in the management of Dry Cough in Paediatric Patients:`,
      blankLines: 4,
    }
  );

  return questions;
}

export async function generateSurveyPdf(input: SurveyPdfInput): Promise<Uint8Array> {
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
  drawLine("NBC Pedia (INDO NBC LABORATORIES PVT LTD)", { size: 18, bold: true, gap: 24 });
  ensureSpace(10);
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_SIZE[0] - MARGIN, y },
    thickness: 1.5,
    color: rgb(0.1, 0.2, 0.4),
  });
  y -= 20;

  drawLine(`Form No: ${input.formNo}`);
  drawLine(`Product Name: ${input.productName}`);
  drawLine(`Dr. Name: ${input.doctorName}`);
  drawLine(`Address: ${input.address || "-"}`);
  y -= 10;

  const questions = buildQuestions(input);

  questions.forEach((question, index) => {
    ensureSpace(LINE_GAP * 2);
    drawLine(`${index + 1}) Dr. ${question.text}`, { bold: true });

    if (question.options) {
      drawLine(question.options.map((opt) => `O  ${opt}`).join("      "));
    }

    if (question.blankLines) {
      for (let i = 0; i < question.blankLines; i++) {
        drawLine(`Enter answer ${i + 1} here _______________________________________________`);
      }
    }

    y -= 8;
  });

  // Footer / signature block
  ensureSpace(LINE_GAP * 5);
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_SIZE[0] - MARGIN, y },
    thickness: 1,
    color: rgb(0.1, 0.2, 0.4),
  });
  y -= 20;
  drawLine("Date: _______________");
  drawLine("Signature & Stamp: _______________");
  drawLine(`Name: ${input.doctorName}`);
  drawLine(`Form No: ${input.formNo}`);

  return pdfDoc.save();
}

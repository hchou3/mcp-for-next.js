import { Mistral } from "@mistralai/mistralai";
import { env } from "./config/env";
import fs from "fs";

export const apiKey = env.MISTRAL_API_KEY;

async function encodePdf(pdfPath: string) {
  try {
    const pdfBuffer = fs.readFileSync(pdfPath);
    const base64Pdf = pdfBuffer.toString("base64");
    return base64Pdf;
  } catch (error) {
    console.error(`Error: ${error}`);
    return null;
  }
}

export async function extractTextFromPDF(pdfPath: string) {
  const client = new Mistral({ apiKey: apiKey });
  const base64Pdf = await encodePdf(pdfPath);
  try {
    const response = await client.ocr.process({
      model: "mistral-ocr-large",
      document: {
        type: "document_url",
        documentUrl: `data:application/pdf;base64,${base64Pdf}`,
      },
      includeImageBase64: true,
    });
    console.log(response);
    return response.pages;
  } catch (error) {
    throw new Error("Failed to extract text from PDF");
  }
}

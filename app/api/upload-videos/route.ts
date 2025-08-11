import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import crypto from "crypto";

//Upload documents to vercel blob
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fileBase64, fileName, contentType } = body as {
      fileBase64: string;
      fileName?: string;
      contentType?: string;
    };

    const resolvedContentType = contentType || "application/octet-stream";

    const isPdfMime = resolvedContentType === "application/pdf";
    const isPdfExt = (fileName || "").toLowerCase().endsWith(".pdf");
    if (!isPdfMime && !isPdfExt) {
      return NextResponse.json(
        { error: "Only PDF uploads are allowed." },
        { status: 400 }
      );
    }
    const uuid = crypto.randomUUID();
    const objectName = `patient_docs/${uuid}.${contentType}`;

    console.log("Uploading to:", objectName);

    const fileBuffer = Buffer.from(fileBase64, "base64");

    const blob = await put(objectName, fileBuffer, {
      access: "public",
      contentType: resolvedContentType,
    });

    const downloadUrl = `${blob.url}?download=${encodeURIComponent(
      fileName || `${uuid}.${contentType}`
    )}`;

    return NextResponse.json({
      success: true,
      url: blob.url,
      downloadUrl,
    });
  } catch (error) {
    console.error("Error uploading video:", error);
    return NextResponse.json(
      { error: "An error occurred while uploading the file." },
      { status: 500 }
    );
  }
}

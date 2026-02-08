import { NextResponse } from "next/server";

const OCR_API_URL = process.env.OCR_API_URL || "http://localhost:8000";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const model =
      (formData.get("model") as string | null) ?? "gemini-2.5-flash-lite";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 },
      );
    }

    const upstreamForm = new FormData();
    upstreamForm.append("file", file, file.name);

    const upstreamUrl = new URL("/analyze/stream", OCR_API_URL);
    upstreamUrl.searchParams.set("model", model);

    const ocrResponse = await fetch(upstreamUrl.toString(), {
      method: "POST",
      body: upstreamForm,
    });

    if (!ocrResponse.ok || !ocrResponse.body) {
      const text = await ocrResponse.text();
      return NextResponse.json(
        { success: false, error: "OCR service error", detail: text },
        { status: 502 },
      );
    }

    return new Response(ocrResponse.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 },
    );
  }
}

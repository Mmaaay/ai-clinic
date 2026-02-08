import { medicalRecordFormSchema } from "@/drizzle/general-medical-history";
import { NextResponse } from "next/server";
import z from "zod";

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

    const upstreamUrl = new URL("/analyze", OCR_API_URL);
    upstreamUrl.searchParams.set("model", model);

    const ocrResponse = await fetch(upstreamUrl.toString(), {
      method: "POST",
      body: upstreamForm,
    });

    if (!ocrResponse.ok) {
      const text = await ocrResponse.text();
      return NextResponse.json(
        { success: false, error: "OCR service error", detail: text },
        { status: 502 },
      );
    }

    const ocrJson = await ocrResponse.json();

    const toArray = <T>(v: T) => (Array.isArray(v) ? v : v ? [v] : []);

    const extraction = ocrJson.extraction || {};

    const mapOcrToForm = {
      patientAllergies: toArray(extraction?.history?.patientAllergies),
      patientConditions: toArray(extraction?.history?.patientConditions),
      patientMedications: toArray(extraction?.history?.patientMedications),
      patientSocialHistory: toArray(extraction?.history?.patientSocialHistory),
      patientSurgeries: toArray(extraction?.history?.patientSurgeries),
      patient: {
        name: extraction.patient?.name,
        name_ar: extraction.patient?.name_ar,
        age: extraction.patient?.age,
        gender: extraction.patient?.gender,
        phone: extraction.patient?.phone,
        height: extraction.patient?.height || null,
        initial_weight: extraction.patient?.initial_weight || null,
        clinic_address: extraction.patient?.clinic_address || "",
        residency: extraction.patient?.residency || "",
        referral: extraction.patient?.referral || "",
        first_visit_date: extraction.patient?.first_visit_date,
        dob: extraction.patient?.dob,
      },
      patientFollowups: toArray(extraction.followups),
      patientLabs: toArray(extraction.labs?.labs),
      patientImaging: toArray(extraction.imaging),
      patientVisits: toArray(extraction.visits),
      patientNotes: toArray(extraction.notes),
    };

    const validated = medicalRecordFormSchema.safeParse(mapOcrToForm);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          issues: z.treeifyError(validated.error),
        },
        { status: 422 },
      );
    }

    return NextResponse.json({ success: true, data: validated.data });
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

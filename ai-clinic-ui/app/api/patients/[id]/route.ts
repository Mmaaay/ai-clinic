import { NextResponse } from "next/server";
import { getPatientById } from "@/lib/server/patient-by-id";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Patient ID required" }, { status: 400 });
  }

  const patient = await getPatientById(id);

  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  return NextResponse.json(patient);
}

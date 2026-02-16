import { NextResponse } from "next/server";
import { getPatientsData } from "@/lib/server/patients";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const patients = await getPatientsData();
    return NextResponse.json(patients);
  } catch (error) {
    console.error("GET /api/patients failed:", error);
    return NextResponse.json(
      { error: "Failed to load patients" },
      { status: 500 },
    );
  }
}

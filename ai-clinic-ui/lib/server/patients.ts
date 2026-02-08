"use server";
import { db } from "@/drizzle/db";
import { Patients } from "@/drizzle/schemas/patient_patients";
import { desc } from "drizzle-orm";

export async function getPatientsData(): Promise<Patients[]> {
  const patientRows = await db.query.patients.findMany({
    orderBy: (p) => [desc(p.createdAt)],
  });

  if (!patientRows) {
    throw new Error("No patients found");
  }

  return patientRows;
}

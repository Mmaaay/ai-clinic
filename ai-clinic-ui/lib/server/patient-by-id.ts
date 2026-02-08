"use server";
import { db } from "@/drizzle/db";

import { Patients, patients } from "@/drizzle/schemas/patient_patients";

import { eq } from "drizzle-orm";
import { PatientIdSchema } from "../schema/data-id-validation";

export type PatientFullRecord = Patients & {
  id: string;
};

export async function getPatientById(
  rawInput: unknown,
): Promise<PatientFullRecord | null> {
  const validation = PatientIdSchema.safeParse(rawInput);

  if (!validation.success) {
    throw new Error(`Validation Failed: ${validation.error.issues[0].message}`);
  }

  const { patientId } = validation.data;

  const data = await db.query.patients.findFirst({
    where: eq(patients.id, patientId),
  });

  if (!data) {
    return null;
  }

  return data;
}

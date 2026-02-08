"use server";
import { db } from "@/drizzle/db";

import {
  patientNotes,
  PatientNotesRecord,
} from "@/drizzle/schemas/patient_notes";
import { eq } from "drizzle-orm";
import { PatientIdSchema } from "../schema/data-id-validation";

export async function getPatientNotesById(
  rawInput: unknown,
): Promise<PatientNotesRecord[] | null> {
  const validation = PatientIdSchema.safeParse(rawInput);

  if (!validation.success) {
    throw new Error(`Validation Failed: ${validation.error.issues[0].message}`);
  }

  const { patientId } = validation.data;

  const data = await db.query.patientNotes.findMany({
    where: eq(patientNotes.patientId, patientId),
  });

  if (!data || data.length === 0) {
    return null;
  }

  return data;
}

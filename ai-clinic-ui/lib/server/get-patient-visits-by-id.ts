"use server";
import { db } from "@/drizzle/db";

import {
  patientVisits,
  PatientVisitsRecord,
} from "@/drizzle/schemas/patient_visits";
import { eq } from "drizzle-orm";
import { PatientIdSchema } from "../schema/data-id-validation";

export async function getPatientVisitsById(
  rawInput: unknown,
): Promise<PatientVisitsRecord[] | null> {
  const validation = PatientIdSchema.safeParse(rawInput);

  if (!validation.success) {
    throw new Error(`Validation Failed: ${validation.error.issues[0].message}`);
  }

  const { patientId } = validation.data;

  const data = await db.query.patientVisits.findMany({
    where: eq(patientVisits.patientId, patientId),
  });

  if (!data || data.length === 0) {
    return null;
  }

  return data;
}

"use server";
import { db } from "@/drizzle/db";

import { patientLabs, PatientLabsRecord } from "@/drizzle/schemas/patient_labs";
import { eq } from "drizzle-orm";
import { PatientIdSchema } from "../schema/data-id-validation";

export async function getPatientLabsById(
  rawInput: unknown,
): Promise<PatientLabsRecord[] | null> {
  const validation = PatientIdSchema.safeParse(rawInput);

  if (!validation.success) {
    throw new Error(`Validation Failed: ${validation.error.issues[0].message}`);
  }

  const { patientId } = validation.data;

  const data = await db.query.patientLabs.findMany({
    where: eq(patientLabs.patientId, patientId),
  });

  if (!data || data.length === 0) {
    return null;
  }

  return data;
}

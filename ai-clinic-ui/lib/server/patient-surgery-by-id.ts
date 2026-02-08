"use server";
import { db } from "@/drizzle/db";
import { PatientSurgery } from "@/drizzle/schemas/patient_surgeries";
import { PatientIdSchema } from "@/lib/schema/data-id-validation";

export type PatientFullRecord = PatientSurgery;
export async function getPatientSurgeryById(rawInput: unknown) {
  const validation = PatientIdSchema.safeParse(rawInput);

  if (!validation.success) {
    throw new Error(`Validation Failed: ${validation.error.issues[0].message}`);
  }
  const { patientId } = validation.data;

  const data = await db.query.patientSurgeries.findFirst({
    where: (surgeries, { eq }) => eq(surgeries.patientId, patientId),
    orderBy: (surgeries, { desc }) => [desc(surgeries.surgeryDate)],
  });

  if (!data) {
    return null;
  }
  return data;
}

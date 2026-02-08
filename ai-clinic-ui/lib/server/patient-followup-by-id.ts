"use server";
import { db } from "@/drizzle/db";
import { PatientIdSchema } from "@/lib/schema/data-id-validation";

export async function getPatientFollowupById(rawInput: unknown) {
  const validation = PatientIdSchema.safeParse(rawInput);

  if (!validation.success) {
    throw new Error(`Validation Failed: ${validation.error.issues[0].message}`);
  }
  const { patientId } = validation.data;

  const data = await db.query.patientFollowups.findFirst({
    where: (f, { eq }) => eq(f.patientId, patientId),
    orderBy: (f, { desc }) => [desc(f.callDate)],
  });
  if (!data) return null;
  return data;
}

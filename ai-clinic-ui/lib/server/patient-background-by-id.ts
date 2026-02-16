"use server";
import { db } from "@/drizzle/db";
import { PatientAllergy } from "@/drizzle/schemas/medical-background/patient_allergies";
import { PatientCondition } from "@/drizzle/schemas/medical-background/patient_conditions";
import { PatientMedication } from "@/drizzle/schemas/medical-background/patient_medications";
import { PatientSocialHistory } from "@/drizzle/schemas/medical-background/patient_social_history";
import { PatientSurgery } from "@/drizzle/schemas/patient_surgeries";
import { PatientIdSchema } from "../schema/data-id-validation";

export interface patientBackground {
  allergies: PatientAllergy[];
  conditions: PatientCondition[];
  medications: PatientMedication[];
  socialHistory: PatientSocialHistory[];
  surgeries: PatientSurgery[];
}

export async function getPatientBackgroundById(rawInput: unknown) {
  const validation = PatientIdSchema.safeParse(rawInput);

  if (!validation.success) {
    throw new Error(`Validation Failed: ${validation.error.issues[0].message}`);
  }

  const { patientId } = validation.data;

  const [allergies, conditions, medications, socialHistory, surgeries] =
    await Promise.all([
      db.query.patientAllergies.findMany({
        where: (allergy, { eq }) => eq(allergy.patientId, patientId),
      }),
      db.query.patientConditions.findMany({
        where: (condition, { eq }) => eq(condition.patientId, patientId),
      }),
      db.query.patientMedications.findMany({
        where: (medication, { eq }) => eq(medication.patientId, patientId),
      }),
      db.query.patientSocialHistory.findMany({
        where: (history, { eq }) => eq(history.patientId, patientId),
      }),
      db.query.patientSurgeries.findMany({
        where: (surgery, { eq }) => eq(surgery.patientId, patientId),
      }),
    ]);

  return {
    allergies,
    conditions,
    medications,
    socialHistory,
    surgeries,
  };
}

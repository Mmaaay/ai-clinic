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
    await db.transaction(async (tx) => {
      const allergies = await tx.query.patientAllergies.findMany({
        where: (allergy, { eq }) => eq(allergy.patientId, patientId),
      });

      const conditions = await tx.query.patientConditions.findMany({
        where: (condition, { eq }) => eq(condition.patientId, patientId),
      });

      const medications = await tx.query.patientMedications.findMany({
        where: (medication, { eq }) => eq(medication.patientId, patientId),
      });

      const socialHistory = await tx.query.patientSocialHistory.findMany({
        where: (history, { eq }) => eq(history.patientId, patientId),
      });

      const surgeries = await tx.query.patientSurgeries.findMany({
        where: (surgery, { eq }) => eq(surgery.patientId, patientId),
      });

      return [allergies, conditions, medications, socialHistory, surgeries];
    });

  return {
    allergies,
    conditions,
    medications,
    socialHistory,
    surgeries,
  };
}

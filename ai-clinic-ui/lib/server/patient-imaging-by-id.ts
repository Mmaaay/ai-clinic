"use server";
import { db } from "@/drizzle/db";

import {
  patientImaging,
  PatientImagingRecord,
} from "@/drizzle/schemas/patient_images";

import { eq } from "drizzle-orm";
import { PatientIdSchema } from "../schema/data-id-validation";

export async function getPatientImagingById(
  rawInput: unknown,
): Promise<PatientImagingRecord[] | null> {
  const validation = PatientIdSchema.safeParse(rawInput);

  if (!validation.success) {
    throw new Error(`Validation Failed: ${validation.error.issues[0].message}`);
  }

  const { patientId } = validation.data;

  const data = await db.query.patientImaging.findMany({
    where: eq(patientImaging.patientId, patientId),
  });

  if (!data || data.length === 0) {
    return null;
  }

  return data;
}

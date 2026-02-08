"use server";

import { db } from "@/drizzle/db";
import { revalidatePath } from "next/cache";
import z from "zod";
import { eq } from "drizzle-orm";

import {
  medicalRecordForm,
  medicalRecordFormSchema,
} from "@/drizzle/general-medical-history";

import { patients } from "@/drizzle/schemas/patient_patients";
import { patientConditions } from "@/drizzle/schemas/medical-background/patient_conditions";
import { patientMedications } from "@/drizzle/schemas/medical-background/patient_medications";
import { patientSurgeries } from "@/drizzle/schemas/patient_surgeries";
import { patientAllergies } from "@/drizzle/schemas/medical-background/patient_allergies";
import { patientSocialHistory } from "@/drizzle/schemas/medical-background/patient_social_history";
import { patientLabs } from "@/drizzle/schemas/patient_labs";
import { patientImaging } from "@/drizzle/schemas/patient_images";
import { patientFollowups } from "@/drizzle/schemas/patient_follow-up";
import { patientNotes } from "@/drizzle/schemas/patient_notes";
import { patientVisits } from "@/drizzle/schemas/patient_visits";

// --- Helper: Clean Phone Numbers (Arabic/Persian -> English) ---
function sanitizePhone(phone: string | null | undefined): string {
  if (!phone) return "";

  const map: Record<string, string> = {
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
    "۰": "0",
    "۱": "1",
    "۲": "2",
    "۳": "3",
    "۴": "4",
    "۵": "5",
    "۶": "6",
    "۷": "7",
    "۸": "8",
    "۹": "9",
  };

  const cleaned = phone.replace(/[٠-٩۰-۹]/g, (char) => map[char] || char);
  // Remove non-digits (spaces, dashes, parens)
  return cleaned.replace(/\D/g, "");
}

function stripId<T extends { id?: unknown }>(item: T): Omit<T, "id"> {
  const { ...rest } = item;
  return rest;
}

export async function createPatientRecord(
  rawInput: medicalRecordForm,
): Promise<{
  success: boolean;
  patientId?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  data?: { patientId: string };
  message?: string;
}> {
  // --- STEP 1: PRE-PROCESS & CLEAN DATA ---
  // Create a shallow copy to modify
  const data = { ...rawInput };

  if (data.patient) {
    // A. Fix Phone Numbers
    if (data.patient.phone)
      data.patient.phone = sanitizePhone(data.patient.phone);
    if (data.patient.optional_phone)
      data.patient.optional_phone = sanitizePhone(data.patient.optional_phone);

    // B. Auto-fill Arabic Name logic
    const hasArabicChars = /[\u0600-\u06FF]/.test(data.patient.name || "");
    if (hasArabicChars && !data.patient.nameAr) {
      data.patient.nameAr = data.patient.name;
    }

    // C. Calculate BMI if missing but Height/Weight exist
    if (
      !data.patient.initial_bmi &&
      data.patient.height &&
      data.patient.initial_weight
    ) {
      const heightM = data.patient.height / 100;
      const bmi = data.patient.initial_weight / (heightM * heightM);
      data.patient.initial_bmi = Math.round(bmi);
    }
  }

  // --- STEP 2: VALIDATE ---
  const validation = medicalRecordFormSchema.safeParse(data);

  if (!validation.success) {
    console.error(
      "Validation Error:",
      z.flattenError(validation.error).fieldErrors,
    );
    return {
      success: false,
      error: "Validation failed. Please check the form fields.",
      fieldErrors: z.flattenError(validation.error).fieldErrors,
    };
  }

  const record = validation.data;

  try {
    // --- STEP 3: DATABASE TRANSACTION ---
    const result = await db.transaction(async (tx) => {
      // 1. Insert Patient (Includes all new fields: height, weight, dob, etc.)
      // Zod has already stripped unknown fields, so record.patient is safe to insert
      const [newPatient] = await tx
        .insert(patients)
        .values({
          ...record.patient,
          // Ensure dates are Dates or null (Postgres doesn't like empty strings for timestamps)
          dob: record.patient.dob ? new Date(record.patient.dob) : null,
          first_visit_date: record.patient.first_visit_date
            ? new Date(record.patient.first_visit_date)
            : null,
        })
        .returning({ id: patients.id });

      const patientId = newPatient.id;

      // 2. Insert Related Arrays
      // We use checks on .length to prevent SQL errors with empty values lists

      if (record.patientConditions?.length) {
        await tx.insert(patientConditions).values(
          record.patientConditions.map((c) => ({
            ...c,
            patientId,
            onsetDate: c.onsetDate ? new Date(c.onsetDate) : null,
          })),
        );
      }

      if (record.patientMedications?.length) {
        await tx.insert(patientMedications).values(
          record.patientMedications.map((m) => ({
            ...m,
            patientId,
            startDate: m.startDate ? new Date(m.startDate) : null,
            endDate: m.endDate ? new Date(m.endDate) : null,
          })),
        );
      }

      if (record.patientSurgeries?.length) {
        await tx.insert(patientSurgeries).values(
          record.patientSurgeries.map((s) => ({
            ...s,
            patientId,
            surgeryDate: s.surgeryDate ? new Date(s.surgeryDate) : null,
          })),
        );
      }

      if (record.patientAllergies?.length) {
        await tx
          .insert(patientAllergies)
          .values(record.patientAllergies.map((a) => ({ ...a, patientId })));
      }

      if (record.patientSocialHistory?.length) {
        await tx
          .insert(patientSocialHistory)
          .values(
            record.patientSocialHistory.map((s) => ({ ...s, patientId })),
          );
      }

      if (record.patientLabs?.length) {
        await tx.insert(patientLabs).values(
          record.patientLabs.map((l) => ({
            ...l,
            patientId,
            labDate: l.labDate ? new Date(l.labDate) : null,
          })),
        );
      }

      if (record.patientImaging?.length) {
        await tx.insert(patientImaging).values(
          record.patientImaging.map((i) => ({
            ...i,
            patientId,
            imageDate: i.studyDate ? new Date(i.studyDate) : null,
          })),
        );
      }

      if (record.patientFollowups?.length) {
        await tx
          .insert(patientFollowups)
          .values(record.patientFollowups.map((f) => ({ ...f, patientId })));
      }

      if (record.patientNotes?.length) {
        await tx.insert(patientNotes).values(
          record.patientNotes.map((n) => ({
            ...n,
            patientId,
          })),
        );
      }

      if (record.patientVisits?.length) {
        await tx
          .insert(patientVisits)
          .values(record.patientVisits.map((v) => ({ ...v, patientId })));
      }

      return { patientId };
    });

    revalidatePath("/");
    revalidatePath("/patients");

    return {
      success: true,
      data: result,
      message: "Patient record created successfully",
    };
  } catch (error) {
    console.error("Create Patient Error:", error);
    // Generic error message to user, detailed log to server console
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Database transaction failed",
    };
  }
}

export async function updatePatientRecord({
  patientId,
  data: rawInput,
}: {
  patientId: string;
  data: Partial<medicalRecordForm>;
}): Promise<{
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}> {
  const data = { ...rawInput };

  if (data.patient) {
    if (data.patient.phone)
      data.patient.phone = sanitizePhone(data.patient.phone);
    if (data.patient.optional_phone)
      data.patient.optional_phone = sanitizePhone(data.patient.optional_phone);

    const hasArabicChars = /[\u0600-\u06FF]/.test(data.patient.name || "");
    if (hasArabicChars && !data.patient.nameAr) {
      data.patient.nameAr = data.patient.name;
    }

    if (
      !data.patient.initial_bmi &&
      data.patient.height &&
      data.patient.initial_weight
    ) {
      const heightM = data.patient.height / 100;
      const bmi = data.patient.initial_weight / (heightM * heightM);
      data.patient.initial_bmi = Math.round(bmi);
    }
  }

  const updateSchema = medicalRecordFormSchema.partial();
  const validation = updateSchema.safeParse(data);

  if (!validation.success) {
    console.error(
      "Validation Error:",
      z.flattenError(validation.error).fieldErrors,
    );
    return {
      success: false,
      error: "Validation failed. Please check the form fields.",
      fieldErrors: z.flattenError(validation.error).fieldErrors,
    };
  }

  const record = validation.data;

  try {
    await db.transaction(async (tx) => {
      if (record.patient) {
        const cleanedPatient = Object.fromEntries(
          Object.entries(record.patient).filter(
            ([, value]) => value !== undefined,
          ),
        );

        if ("dob" in cleanedPatient) {
          const dobValue = cleanedPatient.dob as
            | string
            | Date
            | null
            | undefined;
          cleanedPatient.dob = dobValue ? new Date(dobValue) : null;
        }
        if ("first_visit_date" in cleanedPatient) {
          const firstVisitValue = cleanedPatient.first_visit_date as
            | string
            | Date
            | null
            | undefined;
          cleanedPatient.first_visit_date = firstVisitValue
            ? new Date(firstVisitValue)
            : null;
        }

        await tx
          .update(patients)
          .set(cleanedPatient)
          .where(eq(patients.id, patientId));
      }

      if (record.patientConditions !== undefined) {
        await tx
          .delete(patientConditions)
          .where(eq(patientConditions.patientId, patientId));
        if (record.patientConditions?.length) {
          await tx.insert(patientConditions).values(
            record.patientConditions.map((c) => ({
              ...stripId(c),
              patientId,
              onsetDate: c.onsetDate ? new Date(c.onsetDate) : null,
            })),
          );
        }
      }

      if (record.patientMedications !== undefined) {
        await tx
          .delete(patientMedications)
          .where(eq(patientMedications.patientId, patientId));
        if (record.patientMedications?.length) {
          await tx.insert(patientMedications).values(
            record.patientMedications.map((m) => ({
              ...stripId(m),
              patientId,
              startDate: m.startDate ? new Date(m.startDate) : null,
              endDate: m.endDate ? new Date(m.endDate) : null,
            })),
          );
        }
      }

      if (record.patientSurgeries !== undefined) {
        await tx
          .delete(patientSurgeries)
          .where(eq(patientSurgeries.patientId, patientId));
        if (record.patientSurgeries?.length) {
          await tx.insert(patientSurgeries).values(
            record.patientSurgeries.map((s) => ({
              ...stripId(s),
              patientId,
              surgeryDate: s.surgeryDate ? new Date(s.surgeryDate) : null,
            })),
          );
        }
      }

      if (record.patientAllergies !== undefined) {
        await tx
          .delete(patientAllergies)
          .where(eq(patientAllergies.patientId, patientId));
        if (record.patientAllergies?.length) {
          await tx.insert(patientAllergies).values(
            record.patientAllergies.map((a) => ({
              ...stripId(a),
              patientId,
            })),
          );
        }
      }

      if (record.patientSocialHistory !== undefined) {
        await tx
          .delete(patientSocialHistory)
          .where(eq(patientSocialHistory.patientId, patientId));
        if (record.patientSocialHistory?.length) {
          await tx.insert(patientSocialHistory).values(
            record.patientSocialHistory.map((s) => ({
              ...stripId(s),
              patientId,
            })),
          );
        }
      }

      if (record.patientLabs !== undefined) {
        await tx
          .delete(patientLabs)
          .where(eq(patientLabs.patientId, patientId));
        if (record.patientLabs?.length) {
          await tx.insert(patientLabs).values(
            record.patientLabs.map((l) => ({
              ...stripId(l),
              patientId,
              labDate: l.labDate ? new Date(l.labDate) : null,
            })),
          );
        }
      }

      if (record.patientImaging !== undefined) {
        await tx
          .delete(patientImaging)
          .where(eq(patientImaging.patientId, patientId));
        if (record.patientImaging?.length) {
          await tx.insert(patientImaging).values(
            record.patientImaging.map((i) => ({
              ...stripId(i),
              patientId,
              imageDate: i.studyDate ? new Date(i.studyDate) : null,
            })),
          );
        }
      }

      if (record.patientFollowups !== undefined) {
        await tx
          .delete(patientFollowups)
          .where(eq(patientFollowups.patientId, patientId));
        if (record.patientFollowups?.length) {
          await tx.insert(patientFollowups).values(
            record.patientFollowups.map((f) => ({
              ...stripId(f),
              patientId,
            })),
          );
        }
      }

      if (record.patientNotes !== undefined) {
        await tx
          .delete(patientNotes)
          .where(eq(patientNotes.patientId, patientId));
        if (record.patientNotes?.length) {
          await tx.insert(patientNotes).values(
            record.patientNotes.map((n) => ({
              ...stripId(n),
              patientId,
            })),
          );
        }
      }

      if (record.patientVisits !== undefined) {
        await tx
          .delete(patientVisits)
          .where(eq(patientVisits.patientId, patientId));
        if (record.patientVisits?.length) {
          await tx.insert(patientVisits).values(
            record.patientVisits.map((v) => ({
              ...stripId(v),
              patientId,
            })),
          );
        }
      }
    });

    revalidatePath("/patients");
    revalidatePath(`/patients/${patientId}`);
    revalidatePath(`/patients/${patientId}/background`);
    revalidatePath(`/patients/${patientId}/follow-up`);
    revalidatePath(`/patients/${patientId}/labs`);
    revalidatePath(`/patients/${patientId}/imaging`);
    revalidatePath(`/patients/${patientId}/notes`);
    revalidatePath(`/patients/${patientId}/visits`);

    return { success: true };
  } catch (error) {
    console.error("Update Patient Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Database transaction failed",
    };
  }
}

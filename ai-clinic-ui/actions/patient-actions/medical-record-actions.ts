"use server";

import { db } from "@/drizzle/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import z from "zod";

import {
  medicalRecordForm,
  medicalRecordFormSchema,
  PatientAllergyForm,
  PatientConditionForm,
  PatientFollowupForm,
  PatientForm,
  PatientImagingForm,
  PatientLabForm,
  PatientMedicationForm,
  PatientNoteForm,
  PatientSocialHistoryForm,
  PatientSurgeryForm,
  PatientVisitForm,
} from "@/drizzle/general-medical-history";

import { patientAllergies } from "@/drizzle/schemas/medical-background/patient_allergies";
import { patientConditions } from "@/drizzle/schemas/medical-background/patient_conditions";
import { patientMedications } from "@/drizzle/schemas/medical-background/patient_medications";
import { patientSocialHistory } from "@/drizzle/schemas/medical-background/patient_social_history";
import { patientFollowups } from "@/drizzle/schemas/patient_follow-up";
import { patientImaging } from "@/drizzle/schemas/patient_images";
import { patientLabs } from "@/drizzle/schemas/patient_labs";
import { patientNotes } from "@/drizzle/schemas/patient_notes";
import { patients } from "@/drizzle/schemas/patient_patients";
import { patientSurgeries } from "@/drizzle/schemas/patient_surgeries";
import { patientVisits } from "@/drizzle/schemas/patient_visits";
import { PgColumn, PgTable } from "drizzle-orm/pg-core";

type SubTableKey = Exclude<keyof medicalRecordForm, "patient">;

type SubRecordItem =
  | PatientAllergyForm
  | PatientConditionForm
  | PatientMedicationForm
  | PatientSocialHistoryForm
  | PatientSurgeryForm
  | PatientLabForm
  | PatientImagingForm
  | PatientFollowupForm
  | PatientNoteForm
  | PatientVisitForm;

interface TableConfig {
  key: SubTableKey;
  table: PgTable & { id: PgColumn; patientId: PgColumn };
  dateFields?: Record<string, string | boolean>;
}

const backgroundItemsNames: SubTableKey[] = [
  "patientConditions",
  "patientMedications",
  "patientSurgeries",
  "patientAllergies",
  "patientSocialHistory",
];

const meaningfulFieldsByKey: Record<SubTableKey, string[]> = {
  patientAllergies: ["allergen", "reaction"],
  patientConditions: ["conditionName", "notes", "onsetDate"],
  patientMedications: [
    "drugName",
    "dosage",
    "frequency",
    "startDate",
    "endDate",
  ],
  patientSurgeries: [
    "procedureName",
    "procedureType",
    "surgeryDate",
    "hospitalName",
    "surgeonName",
    "operativeNotes",
    "summaryNotes",
  ],
  patientSocialHistory: ["value", "notes"],
  patientLabs: ["testName", "notes", "results", "labDate"],
  patientImaging: [
    "studyName",
    "impression",
    "report",
    "imageUrl",
    "studyDate",
  ],
  patientFollowups: [
    "callDate",
    "scheduledVisitDate",
    "dietNotes",
    "activityLevel",
    "urineFrequency",
    "spirometer",
    "medicationAdherence",
    "symptoms",
    "bowelMovement",
  ],
  patientNotes: ["title", "content"],
  patientVisits: [
    "urgentPurpose",
    "clinicalFindings",
    "recommendations",
    "weight",
    "bmi",
    "visitDate",
    "nextAppointmentDate",
    "newPrescriptions",
    "investigationsOrdered",
    "visitType",
    "woundStatus",
  ],
};

const hasMeaningfulValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number" || typeof value === "boolean") return true;
  if (value instanceof Date) return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return false;
};

const isMeaningfulItem = (key: SubTableKey, item: SubRecordItem): boolean => {
  const fields = meaningfulFieldsByKey[key] ?? [];
  const record = item as Record<string, unknown>;
  return fields.some((field) => hasMeaningfulValue(record[field]));
};

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

function preparePatientData(
  patientData: PatientForm | Partial<PatientForm> | null | undefined,
): PatientForm | Partial<PatientForm> | null | undefined {
  if (!patientData) return patientData;
  const p = { ...patientData };

  if (p.phone) p.phone = sanitizePhone(p.phone);
  if (p.optional_phone) p.optional_phone = sanitizePhone(p.optional_phone);

  const hasArabicChars = /[\u0600-\u06FF]/.test(p.name || "");
  if (hasArabicChars && !p.nameAr) p.nameAr = p.name;

  if (!p.initial_bmi && p.height && p.initial_weight) {
    const heightM = p.height / 100;
    p.initial_bmi = Math.round(p.initial_weight / (heightM * heightM));
  }

  // Convert string dates to Date objects for Postgres
  if (p.dob) p.dob = new Date(p.dob);
  if (p.first_visit_date) p.first_visit_date = new Date(p.first_visit_date);

  return p;
}

export async function createPatientRecord(rawInput: medicalRecordForm) {
  const data = { ...rawInput, patient: preparePatientData(rawInput.patient) };
  const validation = medicalRecordFormSchema.safeParse(data);

  if (!validation.success) {
    return {
      success: false,
      fieldErrors: z.flattenError(validation.error).fieldErrors,
    };
  }

  const record = validation.data;

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Primary Insert
      const [newPatient] = await tx
        .insert(patients)
        .values(record.patient)
        .returning({ id: patients.id });
      const pId = newPatient.id;

      // 2. Parallel Sub-Inserts (Batching)
      // We don't await each one individually; we fire them all at once.
      const tasks = [];
      if (record.patientConditions?.length)
        tasks.push(
          tx.insert(patientConditions).values(
            record.patientConditions.map((c) => ({
              ...c,
              patientId: pId,
              onsetDate: c.onsetDate ? new Date(c.onsetDate) : null,
            })),
          ),
        );
      if (record.patientMedications?.length)
        tasks.push(
          tx.insert(patientMedications).values(
            record.patientMedications.map((m) => ({
              ...m,
              patientId: pId,
              startDate: m.startDate ? new Date(m.startDate) : null,
              endDate: m.endDate ? new Date(m.endDate) : null,
            })),
          ),
        );
      if (record.patientSurgeries?.length)
        tasks.push(
          tx.insert(patientSurgeries).values(
            record.patientSurgeries.map((s) => ({
              ...s,
              patientId: pId,
              surgeryDate: s.surgeryDate ? new Date(s.surgeryDate) : null,
            })),
          ),
        );
      if (record.patientAllergies?.length)
        tasks.push(
          tx
            .insert(patientAllergies)
            .values(
              record.patientAllergies.map((a) => ({ ...a, patientId: pId })),
            ),
        );
      if (record.patientSocialHistory?.length)
        tasks.push(
          tx.insert(patientSocialHistory).values(
            record.patientSocialHistory.map((s) => ({
              ...s,
              patientId: pId,
            })),
          ),
        );
      if (record.patientLabs?.length)
        tasks.push(
          tx.insert(patientLabs).values(
            record.patientLabs.map((l) => ({
              ...l,
              patientId: pId,
              labDate: l.labDate ? new Date(l.labDate) : null,
            })),
          ),
        );
      if (record.patientImaging?.length)
        tasks.push(
          tx.insert(patientImaging).values(
            record.patientImaging.map((i) => ({
              ...i,
              patientId: pId,
              imageDate: i.studyDate ? new Date(i.studyDate) : null,
            })),
          ),
        );
      if (record.patientFollowups?.length)
        tasks.push(
          tx
            .insert(patientFollowups)
            .values(
              record.patientFollowups.map((f) => ({ ...f, patientId: pId })),
            ),
        );
      if (record.patientNotes?.length)
        tasks.push(
          tx
            .insert(patientNotes)
            .values(record.patientNotes.map((n) => ({ ...n, patientId: pId }))),
        );
      if (record.patientVisits?.length)
        tasks.push(
          tx
            .insert(patientVisits)
            .values(
              record.patientVisits.map((v) => ({ ...v, patientId: pId })),
            ),
        );

      await Promise.all(tasks);
      return { patientId: pId };
    });

    revalidatePath("/patients");
    return { success: true, data: result };
  } catch {
    return { success: false, error: "Database transaction failed" };
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
  const data = { ...rawInput, patient: preparePatientData(rawInput.patient) };
  console.log("Updating patient record with data:", { patientId, data });
  const validation = medicalRecordFormSchema.partial().safeParse(data);

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
      const promises: Promise<unknown>[] = [];

      if (record.patient !== undefined) {
        promises.push(
          tx
            .update(patients)
            .set(record.patient)
            .where(eq(patients.id, patientId)),
        );
      }

      const subTableConfigs: TableConfig[] = [
        {
          key: "patientConditions",
          table: patientConditions,
          dateFields: { onsetDate: true },
        },
        {
          key: "patientMedications",
          table: patientMedications,
          dateFields: { startDate: true, endDate: true },
        },
        {
          key: "patientSurgeries",
          table: patientSurgeries,
          dateFields: { surgeryDate: true },
        },
        { key: "patientAllergies", table: patientAllergies },
        { key: "patientSocialHistory", table: patientSocialHistory },
        {
          key: "patientLabs",
          table: patientLabs,
          dateFields: { labDate: true },
        },
        {
          key: "patientImaging",
          table: patientImaging,
          dateFields: { studyDate: "imageDate" },
        },
        { key: "patientFollowups", table: patientFollowups },
        { key: "patientNotes", table: patientNotes },
        { key: "patientVisits", table: patientVisits },
      ];

      for (const config of subTableConfigs) {
        const key = config.key as keyof typeof record;
        const table = config.table;
        const value = record[key];

        if (value !== undefined) {
          const items = value as SubRecordItem[];

          promises.push(
            (async () => {
              const meaningfulItems = items.filter((item) =>
                isMeaningfulItem(config.key, item),
              );

              if (!items || meaningfulItems.length === 0) {
                await tx.delete(table).where(eq(table.patientId, patientId));
                if (backgroundItemsNames.includes(config.key)) {
                  revalidatePath(`/patients/${patientId}/background`);
                } else {
                  revalidatePath(
                    `/patients/${patientId}/${config.key
                      .replace("patient", "")
                      .toLocaleLowerCase()}`,
                  );
                }
                return;
              }

              if (meaningfulItems.length > 0) {
                const values = meaningfulItems.map((item) => {
                  const cleaned: Record<string, unknown> = {
                    ...(item as Record<string, unknown>),
                    patientId,
                  };

                  if ("id" in cleaned && cleaned.id === undefined) {
                    delete cleaned.id;
                  }

                  if (config.dateFields) {
                    Object.entries(config.dateFields).forEach(
                      ([field, target]) => {
                        const targetField =
                          typeof target === "string" ? target : field;
                        const rawValue = (item as Record<string, unknown>)[
                          field
                        ];
                        if (rawValue instanceof Date) {
                          cleaned[targetField] = rawValue;
                        } else if (rawValue) {
                          cleaned[targetField] = new Date(String(rawValue));
                        } else {
                          cleaned[targetField] = null;
                        }
                      },
                    );
                  }

                  return cleaned;
                });

                const upserts = values.map((value) => {
                  const updateSet = { ...value } as typeof table.$inferInsert;
                  if ("id" in updateSet) {
                    delete (updateSet as { id?: unknown }).id;
                  }
                  if ("patientId" in updateSet) {
                    delete (updateSet as { patientId?: unknown }).patientId;
                  }

                  return tx
                    .insert(table)
                    .values(value as typeof table.$inferInsert)
                    .onConflictDoUpdate({
                      target: table.id,
                      set: updateSet,
                    });
                });

                await Promise.all(upserts);
                if (backgroundItemsNames.includes(config.key)) {
                  revalidatePath(`/patients/${patientId}/background`);
                } else {
                  revalidatePath(
                    `/patients/${patientId}/${config.key
                      .replace("patient", "")
                      .toLocaleLowerCase()}`,
                  );
                }
              }
            })(),
          );
        }
      }

      await Promise.all(promises);
      console.log("Patient record updated successfully:", {
        patientId,
        updatedFields: Object.keys(record),
      });
    });

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

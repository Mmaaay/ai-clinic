import { relations } from "drizzle-orm";
import {
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";
import { patients } from "./patient_patients";

// 1. Enum for Bowel Function (common post-op metric)
export const bowelFunctionEnum = pgEnum("bowel_function", [
  "Normal Stool",
  "Flatus Only",
  "Constipated",
  "Diarrhea",
  "No Movement",
]);

export const patientFollowups = pgTable("patient_followups", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id),

  callDate: timestamp("call_date"),
  scheduledVisitDate: timestamp("scheduled_visit_date"), // "Date patient is aware of"

  medicationAdherence: jsonb("medication_adherence"),

  dietNotes: varchar("diet_notes", { length: 255 }),
  activityLevel: varchar("activity_level", { length: 255 }),

  bowelMovement: bowelFunctionEnum("bowel_movement"),
  urineFrequency: varchar("urine_frequency", { length: 100 }),

  symptoms: jsonb("symptoms"),

  spirometer: varchar("spirometer", { length: 255 }),
});

export const patientFollowupRelations = relations(
  patientFollowups,
  ({ one }) => ({
    patient: one(patients, {
      fields: [patientFollowups.patientId],
      references: [patients.id],
    }),
  }),
);

export const selectPatientFollowupSchema = createSelectSchema(
  patientFollowups,
).extend({
  medicationAdherence: z.any(),
  symptoms: z.any(),
});
export const insertPatientFollowupSchema = createInsertSchema(
  patientFollowups,
  {
    callDate: z.coerce.date().nullable().optional(),
  },
).omit({
  patientId: true,
});
export type PatientFollowup = z.infer<typeof selectPatientFollowupSchema>;
export type NewPatientFollowup = z.infer<typeof insertPatientFollowupSchema>;

import { relations } from "drizzle-orm";
import {
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";
import { patients } from "./patient_patients";

// 1. Enum for WHEN the imaging happened
export const imagingCategoryEnum = pgEnum("imaging_category", [
  "Preoperative",
  "Postoperative",
  "Non-routine",
]);

// 2. Enum for WHAT KIND of scan it is (Modality)
// This helps you filter: "Show me all X-Rays"
export const imagingModalityEnum = pgEnum("imaging_modality", [
  "Ultrasound",
  "X-Ray",
  "Echocardiogram",
  "CT Scan",
  "MRI",
  "Endoscopy",
  "Other",
]);

export const patientImaging = pgTable("patient_imaging", {
  id: uuid("id").primaryKey().defaultRandom(),

  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id),

  studyName: varchar("study_name", { length: 255 }),

  modality: imagingModalityEnum("modality"),
  category: imagingCategoryEnum("category"),

  report: jsonb("report"),

  impression: text("impression"),

  imageUrl: varchar("image_url", { length: 500 }),

  studyDate: timestamp("study_date").defaultNow(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const patientImagingRelations = relations(patientImaging, ({ one }) => ({
  patient: one(patients, {
    fields: [patientImaging.patientId],
    references: [patients.id],
  }),
}));

export const selectPatientsImagingSchema = createSelectSchema(patientImaging, {
  studyDate: z.coerce.date().nullable().optional(),
}).extend({
  report: z.any(),
});
export const insertPatientsImagingSchema = createInsertSchema(
  patientImaging,
).omit({
  patientId: true,
  createdAt: true,
  updatedAt: true,
});

export type PatientImagingRecord = z.infer<typeof selectPatientsImagingSchema>;
export type NewPatientImagingRecord = z.infer<
  typeof insertPatientsImagingSchema
>;

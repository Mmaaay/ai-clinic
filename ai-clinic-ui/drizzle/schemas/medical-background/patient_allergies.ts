import { relations } from "drizzle-orm";
import { pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { patients } from "../patient_patients";
import z from "zod";

export const allergySeverityEnum = pgEnum("allergy_severity", [
  "Mild",
  "Moderate",
  "Severe",
  "Life Threatening",
]);

export const patientAllergies = pgTable("patient_allergies", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id),

  allergen: varchar("allergen", { length: 255 }), // e.g., "Peanuts", "Penicillin"
  reaction: varchar("reaction", { length: 255 }), // e.g., "Hives", "Anaphylaxis"

  severity: allergySeverityEnum("severity").default("Mild"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const patientAllergyRelations = relations(
  patientAllergies,
  ({ one }) => ({
    patient: one(patients, {
      fields: [patientAllergies.patientId],
      references: [patients.id],
    }),
  }),
);

export const selectPatientAllergiesSchema =
  createSelectSchema(patientAllergies);
export const insertPatientAllergiesSchema = createInsertSchema(
  patientAllergies,
).omit({
  patientId: true,
});

export type PatientAllergy = z.infer<typeof selectPatientAllergiesSchema>;
export type NewPatientAllergy = z.infer<typeof insertPatientAllergiesSchema>;

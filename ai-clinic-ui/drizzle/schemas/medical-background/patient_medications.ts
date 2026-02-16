import { relations } from "drizzle-orm";
import { pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";
import { patients } from "../patient_patients";

// Enums for dropdowns
export const medicationTypeEnum = pgEnum("medication_type", [
  "Pre-op",
  "Home",
  "Inpatient",
]);

export const patientMedications = pgTable("patient_medications", {
  id: uuid("id").primaryKey().defaultRandom(),

  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id),

  drugName: varchar("drug_name", { length: 255 }), // e.g., "Glucophage"
  dosage: varchar("dosage", { length: 100 }), // e.g., "500mg"
  frequency: varchar("frequency", { length: 100 }), // e.g., "BID" (Twice a day)

  type: medicationTypeEnum("type").default("Home"),

  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"), // Useful to know if they stopped taking it

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const patientMedicationRelations = relations(
  patientMedications,
  ({ one }) => ({
    patient: one(patients, {
      fields: [patientMedications.patientId],
      references: [patients.id],
    }),
  }),
);

export const aiPatientMedications = createInsertSchema(patientMedications)
  .omit({
    id: true,
    patientId: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
  });
export const selectPatientMedicationsSchema =
  createSelectSchema(patientMedications);
export const insertPatientMedicationsSchema = createInsertSchema(
  patientMedications,
  {
    startDate: z.coerce.date().nullable().optional(),
    endDate: z.coerce.date().nullable().optional(),
  },
).omit({
  patientId: true,
  updatedAt: true,
});

export type PatientMedication = z.infer<typeof selectPatientMedicationsSchema>;
export type NewPatientMedication = z.infer<
  typeof insertPatientMedicationsSchema
>;

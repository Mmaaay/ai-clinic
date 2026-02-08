import { relations } from "drizzle-orm";
import {
  decimal,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";
import { patients } from "./patient_patients";

export const visitTypeEnum = pgEnum("visit_type", ["Routine", "Urgent"]);

export const woundStatusEnum = pgEnum("wound_status", [
  "Clean",
  "Inflamed",
  "Infected",
  "Dehiscence", // Separation of wound edges
  "Healing",
  "Healed",
]);

export const patientVisits = pgTable("patient_visits", {
  id: uuid("id").primaryKey().defaultRandom(),

  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id),

  urgentPurpose: text("urgent_purpose"), // Filled only if visitType is 'Urgent'

  weight: decimal("weight", { precision: 5, scale: 2 }),

  bmi: decimal("bmi", { precision: 4, scale: 1 }),

  visitDate: timestamp("visit_date"),

  visitType: visitTypeEnum("visit_type"),
  woundStatus: woundStatusEnum("wound_status"),
  clinicalFindings: text("clinical_findings"), // The physical exam notes

  newPrescriptions: jsonb("new_prescriptions"),

  investigationsOrdered: jsonb("investigations_ordered"),

  recommendations: text("recommendations"),

  nextAppointmentDate: timestamp("next_appointment_date"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const patientVisitRelations = relations(patientVisits, ({ one }) => ({
  patient: one(patients, {
    fields: [patientVisits.patientId],
    references: [patients.id],
  }),
}));

export const selectPatientVisitsSchema = createSelectSchema(
  patientVisits,
).extend({
  newPrescriptions: z.any(),
  investigationsOrdered: z.any(),
});
export const insertPatientVisitsSchema = createInsertSchema(patientVisits, {
  visitDate: z.coerce.date().optional().nullable(),
}).omit({
  patientId: true,
  createdAt: true,
  updatedAt: true,
});
export type PatientVisitsRecord = z.infer<typeof selectPatientVisitsSchema>;
export type NewPatientVisitsRecord = z.infer<typeof insertPatientVisitsSchema>;

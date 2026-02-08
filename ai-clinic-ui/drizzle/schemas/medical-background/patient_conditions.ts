import { relations } from "drizzle-orm";
import { pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";
import { patients } from "../patient_patients";

export const conditionStatusEnum = pgEnum("condition_status", [
  "Active",
  "Resolved",
]);

export const complaintType = pgEnum("complaint_type", [
  "Chief Complaint",
  "Past History",
]);

export const patientConditions = pgTable("patient_conditions", {
  id: uuid("id").primaryKey().defaultRandom(),

  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id),
  conditionName: varchar("condition_name", { length: 255 }),
  conditionStatus: conditionStatusEnum(),
  onsetDate: timestamp("onset_date"),
  type: complaintType(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updateAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const patientConditionRelation = relations(
  patientConditions,
  ({ one }) => ({
    patient: one(patients, {
      fields: [patientConditions.patientId],
      references: [patients.id],
    }),
  }),
);

export const selectPatientConditionsSchema =
  createSelectSchema(patientConditions);
export const insertPatientConditionsSchema = createInsertSchema(
  patientConditions,
  {
    onsetDate: z.coerce.date().optional().nullable(),
  },
).omit({
  patientId: true,
  updateAt: true,
});

export type PatientCondition = z.infer<typeof selectPatientConditionsSchema>;
export type NewPatientCondition = z.infer<typeof insertPatientConditionsSchema>;

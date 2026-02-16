import { relations } from "drizzle-orm";
import {
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

// Enum based on the bariatric procedures you listed
export const procedureTypeEnum = pgEnum("procedure_type", [
  "Sleeve Gastrectomy",
  "Gastric Bypass (RNY)",
  "Mini Gastric Bypass (MGB)",
  "SASI",
  "Gastric Balloon",
  "Revisional Surgery",
  "Other",
]);

export const patientSurgeries = pgTable("patient_surgeries", {
  id: uuid("id").primaryKey().defaultRandom(),

  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),

  // The "Procedure Name" is essential for quick lists (e.g., "Lap Cholecystectomy")
  procedureName: varchar("procedure_name", { length: 255 }),
  procedureType: procedureTypeEnum("procedure_type"),

  surgeryDate: timestamp("surgery_date"),
  hospitalName: varchar("hospital_name", { length: 255 }),

  // Team details
  surgeonName: varchar("surgeon_name", { length: 255 }),
  firstAssistant: varchar("first_assistant", { length: 255 }),
  secondAssistant: varchar("second_assistant", { length: 255 }),
  dissectionBy: varchar("dissection_by", { length: 255 }),
  cameraMan: varchar("camera_man", { length: 255 }),

  // The full report content
  operativeNotes: text("operative_notes"),
  summaryNotes: text("summary_notes"), // Short version for dashboard tooltips

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const patientSurgeriesRelations = relations(
  patientSurgeries,
  ({ one }) => ({
    patient: one(patients, {
      fields: [patientSurgeries.patientId],
      references: [patients.id],
    }),
  }),
);

export const selectPatientSurgeriesSchema =
  createSelectSchema(patientSurgeries);
export const insertPatientSurgeriesSchema = createInsertSchema(
  patientSurgeries,
  {
    surgeryDate: z.coerce.date().nullable().optional(),
  },
).omit({
  patientId: true,
});

export const aiPatientSurgeriesSchema = createInsertSchema(patientSurgeries)
  .omit({
    id: true,
    patientId: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    surgeryDate: z.string().nullable().optional(),
  });

export type PatientSurgery = z.infer<typeof insertPatientSurgeriesSchema>;

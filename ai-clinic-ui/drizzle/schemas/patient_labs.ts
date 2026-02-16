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

// Enum to categorize when the lab was taken
export const labCategoryEnum = pgEnum("lab_category", [
  "Preoperative",
  "Postoperative",
  "Non-routine",
]);

// Enum for the status of the lab result
export const labStatusEnum = pgEnum("lab_status", [
  "Pending",
  "Final",
  "Cancelled",
]);

export const patientLabs = pgTable("patient_labs", {
  id: uuid("id").primaryKey().defaultRandom(),

  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id),

  testName: varchar("test_name", { length: 255 }),

  results: jsonb("results"),

  category: labCategoryEnum("category"),
  status: labStatusEnum("status"),

  labDate: timestamp("lab_date").defaultNow(),
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const patientLabRelations = relations(patientLabs, ({ one }) => ({
  patient: one(patients, {
    fields: [patientLabs.patientId],
    references: [patients.id],
  }),
}));

export const selectPatientLabsSchema = createSelectSchema(patientLabs).extend({
  results: z.any(),
});
export const insertPatientLabsSchema = createInsertSchema(patientLabs, {
  labDate: z.coerce.date().nullable().optional(),
}).omit({
  patientId: true,
  createdAt: true,
  updatedAt: true,
});

export const aiPatientLabsSchema = createInsertSchema(patientLabs)
  .omit({
    id: true,
    patientId: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    labDate: z.string().nullable().optional(),
  });

export type PatientLabsRecord = z.infer<typeof selectPatientLabsSchema>;
export type NewPatientLabsRecord = z.infer<typeof insertPatientLabsSchema>;

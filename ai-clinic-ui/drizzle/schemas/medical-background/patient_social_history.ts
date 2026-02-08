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
import { patients } from "../patient_patients";

export const socialHistoryCategoryEnum = pgEnum("social_history_category", [
  "Smoking",
  "Alcohol",
  "Diet",
  "Exercise",
  "Other",
]);

export const patientSocialHistory = pgTable("patient_social_history", {
  id: uuid("id").primaryKey().defaultRandom(),

  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id),

  category: socialHistoryCategoryEnum("category"), // e.g., "Smoking"
  value: varchar("value", { length: 255 }), // e.g., "1 pack/day", "Vegetarian"

  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const patientSocialHistoryRelations = relations(
  patientSocialHistory,
  ({ one }) => ({
    patient: one(patients, {
      fields: [patientSocialHistory.patientId],
      references: [patients.id],
    }),
  }),
);

export const selectPatientSocialHistorySchema =
  createSelectSchema(patientSocialHistory);
export const insertPatientSocialHistorySchema = createInsertSchema(
  patientSocialHistory,
).omit({
  patientId: true,
  createdAt: true,
  updatedAt: true,
});

export type PatientSocialHistory = z.infer<
  typeof selectPatientSocialHistorySchema
>;
export type NewPatientSocialHistory = z.infer<
  typeof insertPatientSocialHistorySchema
>;

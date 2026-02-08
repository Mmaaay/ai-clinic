import { relations } from "drizzle-orm";
import {
  boolean,
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

export const noteCategoryEnum = pgEnum("note_category", [
  "General",
  "Administrative", // e.g. Insurance, Payments
  "Secondary Procedure", // e.g. Endoscopy performed later
  "Communication", // e.g. Email/Phone call outside of standard follow-up
  "Other",
]);

export const patientNotes = pgTable("patient_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id),

  // Quick title for the list view, e.g., "Insurance Approval"
  title: varchar("title", { length: 255 }),

  category: noteCategoryEnum("category"),

  // The main content
  content: text("content"),

  // To identify WHO wrote the note (if you have multiple users)
  // createdBy: uuid("created_by").references(() => users.id),

  isPinned: boolean("is_pinned").default(false), // Useful to keep important notes at the top

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const patientNoteRelations = relations(patientNotes, ({ one }) => ({
  patient: one(patients, {
    fields: [patientNotes.patientId],
    references: [patients.id],
  }),
}));

export const selectPatientNotesSchema = createSelectSchema(patientNotes);
export const insertPatientNotesSchema = createInsertSchema(patientNotes).omit({
  patientId: true,
  updatedAt: true,
});

export type PatientNotesRecord = z.infer<typeof selectPatientNotesSchema>;
export type NewPatientNotesRecord = z.infer<typeof insertPatientNotesSchema>;

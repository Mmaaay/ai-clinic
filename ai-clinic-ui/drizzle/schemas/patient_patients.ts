import { relations } from "drizzle-orm";
import {
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";

import { patientAllergies } from "./medical-background/patient_allergies";
import { patientConditions } from "./medical-background/patient_conditions";
import { patientMedications } from "./medical-background/patient_medications";
import { patientSocialHistory } from "./medical-background/patient_social_history";
import { patientFollowups } from "./patient_follow-up";
import { patientImaging } from "./patient_images";
import { patientLabs } from "./patient_labs";
import { patientNotes } from "./patient_notes";
import { patientSurgeries } from "./patient_surgeries";
import { patientVisits } from "./patient_visits";

export const patientStatusEnum = pgEnum("status", [
  "Active",
  "Complicated",
  "Deceased",
  "Other",
]);
export type patientStatusEnumType = z.infer<typeof patientStatusEnum>;

export const patients = pgTable("patients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("name_ar", { length: 255 }),
  nationalId: varchar("national_id", { length: 100 }),
  age: integer("age"),
  gender: varchar("gender", { length: 50 }),
  dob: timestamp("dob"),
  phone: varchar("phone", { length: 50 }),
  optional_phone: varchar("opt_phone", { length: 50 }),
  height: integer("height"),
  initial_weight: integer("int_weight"),
  initial_bmi: integer("int_bmi"),
  clinic_address: varchar("clinic_address"),
  residency: varchar("residency"),
  referral: varchar("referral"),
  call_center_agent: varchar("agent"),
  status: patientStatusEnum(),
  first_visit_date: timestamp("first_visit"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const patientRelations = relations(patients, ({ many }) => ({
  conditions: many(patientConditions),
  medications: many(patientMedications),
  allergies: many(patientAllergies),
  socialHistory: many(patientSocialHistory),
  labs: many(patientLabs),
  imaging: many(patientImaging),
  Surgeries: many(patientSurgeries),
  followups: many(patientFollowups),
  visits: many(patientVisits),
  notes: many(patientNotes),
}));

export const selectPatientsSchema = createSelectSchema(patients);
export const insertPatientsSchema = createInsertSchema(patients, {
  dob: z.coerce.date().nullable().optional(),
  first_visit_date: z.coerce.date().nullable().optional(),
}).omit({
  createdAt: true,
  updatedAt: true,
});
export const emptyPatientInsert = insertPatientsSchema.parse({
  name: "",
  nameAr: "",
  nationalId: "",
  age: 0,
  gender: "",
  dob: null,
  phone: "",
  optional_phone: "",
  height: 0,
  initial_weight: 0,
  initial_bmi: 0,
  clinic_address: "",
  residency: "",
  referral: "",
  call_center_agent: "",
  status: "Complicated",
  first_visit_date: new Date(),
});

export const aiPatientsSchema = createInsertSchema(patients)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    dob: z.string().nullable().optional(),
    first_visit_date: z.string().nullable().optional(),
  });

export type Patients = z.infer<typeof selectPatientsSchema>;
export type NewPatient = z.infer<typeof insertPatientsSchema>;

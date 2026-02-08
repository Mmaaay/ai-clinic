import z from "zod";
import { insertPatientAllergiesSchema } from "./schemas/medical-background/patient_allergies";
import { insertPatientsSchema } from "./schemas/patient_patients";
import { insertPatientConditionsSchema } from "./schemas/medical-background/patient_conditions";
import { insertPatientMedicationsSchema } from "./schemas/medical-background/patient_medications";
import { insertPatientSocialHistorySchema } from "./schemas/medical-background/patient_social_history";
import { insertPatientFollowupSchema } from "./schemas/patient_follow-up";
import { insertPatientsImagingSchema } from "./schemas/patient_images";
import { insertPatientNotesSchema } from "./schemas/patient_notes";
import { insertPatientVisitsSchema } from "./schemas/patient_visits";
import { insertPatientLabsSchema } from "./schemas/patient_labs";
import { insertPatientSurgeriesSchema } from "./schemas/patient_surgeries";

export const medicalRecordFormSchema = z.object({
  patientAllergies: z.array(insertPatientAllergiesSchema).optional(),
  patientConditions: z.array(insertPatientConditionsSchema).optional(),
  patientMedications: z.array(insertPatientMedicationsSchema).optional(),
  patientSocialHistory: z.array(insertPatientSocialHistorySchema).optional(),
  patientSurgeries: z.array(insertPatientSurgeriesSchema).optional(),
  patient: insertPatientsSchema.partial(),
  patientFollowups: z.array(insertPatientFollowupSchema).optional(),
  patientLabs: z.array(insertPatientLabsSchema).optional(),
  patientImaging: z.array(insertPatientsImagingSchema).optional(),
  patientVisits: z.array(insertPatientVisitsSchema).optional(),
  patientNotes: z.array(insertPatientNotesSchema).optional(),
});

export type medicalRecordForm = z.infer<typeof medicalRecordFormSchema>;
export type PatientForm = z.infer<typeof insertPatientsSchema>;
export type PatientAllergyForm = z.infer<typeof insertPatientAllergiesSchema>;
export type PatientConditionForm = z.infer<
  typeof insertPatientConditionsSchema
>;
export type PatientMedicationForm = z.infer<
  typeof insertPatientMedicationsSchema
>;
export type PatientSocialHistoryForm = z.infer<
  typeof insertPatientSocialHistorySchema
>;
export type PatientFollowupForm = z.infer<typeof insertPatientFollowupSchema>;
export type PatientLabForm = z.infer<typeof insertPatientLabsSchema>;
export type PatientImagingForm = z.infer<typeof insertPatientsImagingSchema>;
export type PatientVisitForm = z.infer<typeof insertPatientVisitsSchema>;
export type PatientNoteForm = z.infer<typeof insertPatientNotesSchema>;
export type PatientSurgeryForm = z.infer<typeof insertPatientSurgeriesSchema>;

// Fresh factory functions so callers get new object instances each time.
export const createEmptyPatient = (): PatientForm => ({
  name: "",
  phone: "",
});

export const createEmptyAllergy = (): PatientAllergyForm => ({
  allergen: "",
  reaction: "",
  severity: "Mild",
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const createEmptyCondition = (): PatientConditionForm => ({
  conditionName: "",
  conditionStatus: "Active",
  onsetDate: null,
  type: "Chief Complaint",
});

export const createEmptyMedication = (): PatientMedicationForm => ({
  drugName: "",
  dosage: "0",
  frequency: "0",
  type: "Home",
  startDate: null,
  endDate: null,
});

export const createEmptySocialHistory = (): PatientSocialHistoryForm => ({
  category: "Smoking",
  value: "",
  notes: "",
});

export const createEmptySurgery = (): PatientSurgeryForm => ({
  procedureName: "",
  procedureType: "Other",
  surgeonName: "",
  surgeryDate: new Date(),
  cameraMan: "",
  dissectionBy: "",
  firstAssistant: "",
  secondAssistant: "",
  hospitalName: "",
  operativeNotes: "",
  summaryNotes: "",
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const createEmptyFollowup = (): PatientFollowupForm =>
  ({}) as PatientFollowupForm;

export const createEmptyLab = (): PatientLabForm => ({
  testName: "",
});

export const createEmptyImaging = (): PatientImagingForm => ({
  studyName: "",
});

export const createEmptyVisit = (): PatientVisitForm =>
  ({}) as PatientVisitForm;

export const createEmptyNote = (): PatientNoteForm => ({
  title: "",
  content: "",
});

export const createEmptyMedicalRecord = (): medicalRecordForm => ({
  patientAllergies: [createEmptyAllergy()],
  patientConditions: [createEmptyCondition()],
  patientMedications: [createEmptyMedication()],
  patientSocialHistory: [createEmptySocialHistory()],
  patient: createEmptyPatient(),
  patientSurgeries: [createEmptySurgery()],
  patientFollowups: [createEmptyFollowup()],
  patientLabs: [createEmptyLab()],
  patientImaging: [createEmptyImaging()],
  patientVisits: [createEmptyVisit()],
  patientNotes: [createEmptyNote()],
});

// Backward-compatible constant while allowing fresh instances via the factory.
export const emptyMedicalRecord: medicalRecordForm = createEmptyMedicalRecord();

import { z } from "zod";

// Define the base requirements
const ParamsSchema = z.object({
  patientId: z.string().uuid({ message: "Invalid Patient UUID" }),
  surgeryId: z.string().uuid({ message: "Invalid Surgery UUID" }),
});

// Create reusable variations
export const PatientIdSchema = ParamsSchema.pick({ patientId: true });
export const SurgeryIdSchema = ParamsSchema.pick({ surgeryId: true });
export const FullLookupSchema = ParamsSchema; // Both required

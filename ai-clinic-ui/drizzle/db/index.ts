import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// 1. Import all your individual schema files
// Based on the file paths you shared earlier:

// Main Patient Profile
import * as patients from "../schemas/patient_patients";

// Medical Background (Subfolder)
import * as conditions from "../schemas/medical-background/patient_conditions";
import * as medications from "../schemas/medical-background/patient_medications";
import * as pastSurgeries from "../schemas/patient_surgeries";
import * as allergies from "../schemas/medical-background/patient_allergies";
import * as socialHistory from "../schemas/medical-background/patient_social_history";

// Clinical Data
import * as labs from "../schemas/patient_labs";
import * as imaging from "../schemas/patient_images";
import * as operative from "../schemas/patient_surgeries"; // Your operative reports
import * as followups from "../schemas/patient_follow-up";
import * as visits from "../schemas/patient_visits";
import * as notes from "../schemas/patient_notes";

// 2. Setup Connection
const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const client = postgres(connectionString, { prepare: false });

// 3. Flatten all exports into one schema object
// This works because we gave every table and relation a unique name
// (e.g., 'patientLabs', 'patientLabRelations')
export const schema = {
  ...patients,

  // Medical Background
  ...conditions,
  ...medications,
  ...pastSurgeries,
  ...allergies,
  ...socialHistory,

  // Clinical
  ...labs,
  ...imaging,
  ...operative,
  ...followups,
  ...visits,
  ...notes,
};

// 4. Initialize Drizzle
export const db = drizzle(client, { schema });

export type Database = typeof db;

-- 1. Fix the column type alteration by adding the USING clause
ALTER TABLE "patients" 
ALTER COLUMN "dob" TYPE timestamp 
USING "dob"::timestamp;

-- 2. Add the primary keys (these were fine)
ALTER TABLE "patient_allergies" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "patient_conditions" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "patient_medications" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "patient_social_history" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;
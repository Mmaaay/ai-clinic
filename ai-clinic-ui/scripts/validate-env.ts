// @ts-check
/**
 * Validate environment variables before build/commit.
 * Run: npx tsx scripts/validate-env.ts
 */

import { z } from "zod";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load .env file
dotenv.config({ path: resolve(process.cwd(), ".env") });

const envSchema = z.object({
  DATABASE_URL: z
    .string({ message: "DATABASE_URL is required" })
    .url("DATABASE_URL must be a valid URL"),
  NEXT_PUBLIC_API_URL: z
    .string({ message: "NEXT_PUBLIC_API_URL is required" })
    .url("NEXT_PUBLIC_API_URL must be a valid URL"),
});

function validateEnv(): boolean {
  console.log("🔍 Validating UI environment...");

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.log("❌ Environment validation failed:");
    result.error.issues.forEach((issue) => {
      console.log(`   - ${issue.path.join(".")}: ${issue.message}`);
    });
    return false;
  }

  console.log("✅ UI environment is valid");
  console.log(
    `   - DATABASE_URL: ${result.data.DATABASE_URL.replace(/:[^:@]+@/, ":****@")}`,
  );
  console.log(`   - NEXT_PUBLIC_API_URL: ${result.data.NEXT_PUBLIC_API_URL}`);
  return true;
}

const success = validateEnv();
process.exit(success ? 0 : 1);

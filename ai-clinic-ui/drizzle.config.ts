import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set.");
}

config({ path: ".env" });

export default defineConfig({
  schema: "./drizzle/schemas/*",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
  schemaFilter: ["public"],
  tablesFilter: ["app_*", "public.*", "patient_*"],
});

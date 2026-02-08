import { z, ZodError, ZodSchema } from "zod";

/**
 * Result type for validation
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors: Record<string, string[]> };

/**
 * Validate data against a Zod schema
 * Works on both client and server
 */
export function validateWithZod<T>(
  schema: ZodSchema<T>,
  data: unknown,
): ValidationResult<T> {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path].push(issue.message);
      });
      return {
        success: false,
        error: "Validation failed",
        fieldErrors,
      };
    }
    return {
      success: false,
      error: "Unknown validation error",
      fieldErrors: {},
    };
  }
}

/**
 * Safe parse that returns a typed result
 */
export function safeValidate<T>(
  schema: ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Format Zod errors into a user-friendly object
 */
export function formatZodErrors(error: ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  error.issues.forEach((issue) => {
    const path = issue.path.join(".");
    if (!fieldErrors[path]) {
      fieldErrors[path] = [];
    }
    fieldErrors[path].push(issue.message);
  });
  return fieldErrors;
}

/**
 * Get first error message for a field
 */
export function getFirstError(
  fieldErrors: Record<string, string[]>,
  field: string,
): string | undefined {
  return fieldErrors[field]?.[0];
}

/**
 * Check if a field has errors
 */
export function hasFieldError(
  fieldErrors: Record<string, string[]>,
  field: string,
): boolean {
  return Boolean(fieldErrors[field]?.length);
}

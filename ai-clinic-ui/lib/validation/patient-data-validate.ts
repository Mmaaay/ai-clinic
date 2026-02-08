import z from "zod";

export const zValidate =
  (schema: z.ZodTypeAny) =>
  ({ value }: { value: unknown }): string | undefined => {
    const result = schema.safeParse(value);
    return result.success
      ? undefined
      : z.treeifyError(result.error).errors.join(", ");
  };

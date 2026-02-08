import {
  createFormHook,
  createFormHookContexts,
  formOptions,
} from "@tanstack/react-form";
import { emptyMedicalRecord } from "@/drizzle/general-medical-history";

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

export const { useAppForm, withForm } = createFormHook({
  fieldComponents: {},
  formComponents: {},
  fieldContext,
  formContext,
});

export const medicalRecordFormOpts = formOptions({
  defaultValues: { ...emptyMedicalRecord },
});

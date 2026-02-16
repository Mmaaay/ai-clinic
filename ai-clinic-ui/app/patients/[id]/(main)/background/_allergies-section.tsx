"use client";

import React from "react";
import { AlertCircle, Calendar, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zValidate } from "@/lib/validation/patient-data-validate";
import type { PatientAllergy } from "@/drizzle/schemas/medical-background/patient_allergies";
import z from "zod";

const requiredString = z
  .string()
  .trim()
  .min(1, "Enter at least 1 character")
  .optional();
const severitySchema = z.enum([
  "Mild",
  "Moderate",
  "Severe",
  "Life Threatening",
]);
type AllergySeverity = z.infer<typeof severitySchema>;

type AllergyForm = {
  allergen?: string | null;
  severity?: AllergySeverity | null;
  patientId?: string;
  createdAt?: Date | string | null;
};

type ArrayFieldApi<T> = {
  state: { value?: T[] };
  removeValue: (index: number) => void;
  pushValue: (value: T) => void;
};

type SimpleFieldApi<T> = {
  state: { value: T };
  handleChange: (value: T) => void;
  handleBlur: () => void;
};

type FieldRenderProps = {
  name: string;
  mode?: "array";
  validators?: unknown;
  children: (field: unknown) => React.ReactNode;
};

type FormApi = {
  Field: (props: FieldRenderProps) => React.ReactNode;
};

type FieldErrorComponent = <T>(props: {
  field: SimpleFieldApi<T>;
}) => React.ReactNode;

interface AllergiesSectionProps {
  form: FormApi;
  patientId: string;
  isEditing: boolean;
  filteredAllergies: PatientAllergy[];
  getSeverityColor: (severity: AllergySeverity | null) => string;
  formatDateForInput: (date: Date | string | null | undefined) => string;
  displayDate: (date: Date | string | null | undefined) => string;
  FieldError: FieldErrorComponent;
}

export default function AllergiesSection({
  form,
  patientId,
  isEditing,
  filteredAllergies,
  getSeverityColor,
  formatDateForInput,
  displayDate,
  FieldError,
}: AllergiesSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-destructive" />
        <h2 className="text-md font-bold uppercase tracking-wider text-muted-foreground">
          Allergies
        </h2>
      </div>

      {isEditing ? (
        <form.Field name="allergies" mode="array">
          {(fieldValue) => {
            const field = fieldValue as ArrayFieldApi<AllergyForm>;
            return (
              <div className="space-y-2">
                {field.state.value?.map((_, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-2 bg-card p-3 border rounded-lg shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row gap-2 items-start">
                      {/* Date Input */}
                      <form.Field name={`allergies[${i}].createdAt`}>
                        {(subValue) => {
                          const sub = subValue as SimpleFieldApi<
                            Date | string | null
                          >;
                          return (
                            <div className="w-full sm:w-32">
                              <Input
                                type="date"
                                className="h-9 text-xs"
                                value={formatDateForInput(sub.state.value)}
                                onChange={(e) =>
                                  sub.handleChange(new Date(e.target.value))
                                }
                              />
                            </div>
                          );
                        }}
                      </form.Field>

                      {/* Allergen Name */}
                      <form.Field
                        name={`allergies[${i}].allergen`}
                        validators={{
                          onChange: zValidate(requiredString),
                        }}
                      >
                        {(subValue) => {
                          const sub = subValue as SimpleFieldApi<
                            string | null | undefined
                          >;
                          return (
                            <div className="flex-1 w-full">
                              <Input
                                placeholder="Allergen Name"
                                className="h-9"
                                value={sub.state.value as string}
                                onChange={(e) =>
                                  sub.handleChange(e.target.value)
                                }
                                onBlur={sub.handleBlur}
                              />
                              <FieldError field={sub} />
                            </div>
                          );
                        }}
                      </form.Field>

                      {/* Severity */}
                      <form.Field
                        name={`allergies[${i}].severity`}
                        validators={{
                          onChange: zValidate(severitySchema),
                        }}
                      >
                        {(subValue) => {
                          const sub = subValue as SimpleFieldApi<
                            AllergySeverity | null | undefined
                          >;
                          return (
                            <div className="w-full sm:w-40">
                              <select
                                className="h-9 px-2 border rounded-md text-sm bg-background w-full"
                                value={sub.state.value || "Mild"}
                                onChange={(e) =>
                                  sub.handleChange(
                                    e.target.value as AllergySeverity,
                                  )
                                }
                                onBlur={sub.handleBlur}
                              >
                                <option value="Mild">Mild</option>
                                <option value="Moderate">Moderate</option>
                                <option value="Severe">Severe</option>
                                <option value="Life Threatening">
                                  Life Threatening
                                </option>
                              </select>
                            </div>
                          );
                        }}
                      </form.Field>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => field.removeValue(i)}
                        className="text-destructive h-9 w-9"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed"
                  onClick={() =>
                    field.pushValue({
                      allergen: "",
                      severity: "Mild",
                      patientId,
                      createdAt: new Date(), // Default to today
                    })
                  }
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Allergy
                </Button>
              </div>
            );
          }}
        </form.Field>
      ) : (
        <div className="space-y-2">
          {/* View Mode: Flat List with Date inside Card */}
          {filteredAllergies.length > 0 ? (
            filteredAllergies.map((a, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-3 rounded-lg border border-l-4 border-l-destructive bg-card"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{a.allergen}</span>
                  {/* Date shown here */}
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {displayDate(a.createdAt)}
                  </span>
                </div>
                <Badge className={getSeverityColor(a.severity)}>
                  {a.severity}
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No allergies match the selected date.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

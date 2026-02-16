"use client";

import React from "react";
import { Calendar, Pill, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { zValidate } from "@/lib/validation/patient-data-validate";
import type { PatientMedication } from "@/drizzle/schemas/medical-background/patient_medications";
import z from "zod";

const requiredString = z
  .string()
  .trim()
  .min(1, "Enter at least 1 character")
  .optional();

type MedicationForm = {
  drugName?: string | null;
  dosage?: string | null;
  frequency?: string | null;
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

interface MedicationsSectionProps {
  form: FormApi;
  patientId: string;
  isEditing: boolean;
  filteredMedications: PatientMedication[];
  formatDateForInput: (date: Date | string | null | undefined) => string;
  displayDate: (date: Date | string | null | undefined) => string;
  FieldError: FieldErrorComponent;
}

export default function MedicationsSection({
  form,
  patientId,
  isEditing,
  filteredMedications,
  formatDateForInput,
  displayDate,
  FieldError,
}: MedicationsSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Pill className="w-5 h-5 text-emerald-500" />
        <h2 className="text-md font-bold uppercase tracking-wider text-muted-foreground">
          Medications
        </h2>
      </div>
      {isEditing ? (
        <form.Field name="medications" mode="array">
          {(fieldValue) => {
            const field = fieldValue as ArrayFieldApi<MedicationForm>;
            return (
              <div className="space-y-2">
                {field.state.value?.map((_, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-2 p-3 border rounded-lg bg-card"
                  >
                    <div className="flex flex-col sm:flex-row gap-2 items-start">
                      {/* Date Input */}
                      <form.Field name={`medications[${i}].createdAt`}>
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

                      <form.Field
                        name={`medications[${i}].drugName`}
                        validators={{ onChange: zValidate(requiredString) }}
                      >
                        {(subValue) => {
                          const sub = subValue as SimpleFieldApi<
                            string | null | undefined
                          >;
                          return (
                            <div className="flex-1">
                              <Input
                                placeholder="Drug Name"
                                className="h-9"
                                value={sub.state.value ?? ""}
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
                      <form.Field
                        name={`medications[${i}].dosage`}
                        validators={{ onChange: zValidate(requiredString) }}
                      >
                        {(subValue) => {
                          const sub = subValue as SimpleFieldApi<
                            string | null | undefined
                          >;
                          return (
                            <div className="w-full sm:w-32">
                              <Input
                                placeholder="Dosage"
                                className="h-9"
                                value={sub.state.value ?? ""}
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive h-9 w-9 px-0"
                        onClick={() => field.removeValue(i)}
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
                      drugName: "",
                      dosage: "",
                      frequency: "Daily",
                      patientId,
                      createdAt: new Date(),
                    })
                  }
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Medication
                </Button>
              </div>
            );
          }}
        </form.Field>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* View Mode: Cards with Date */}
          {filteredMedications.length > 0 ? (
            filteredMedications?.map((m, i) => (
              <Card
                key={i}
                className="shadow-none border-l-4 border-l-emerald-500"
              >
                <CardContent className="p-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold">{m.drugName}</p>
                    <p className="text-xs text-muted-foreground mb-1">
                      {m.dosage} — {m.frequency}
                    </p>
                    {/* Date shown here */}
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-muted/50 w-fit px-1 rounded">
                      <Calendar className="w-3 h-3" />
                      {displayDate(m.createdAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No medications recorded.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

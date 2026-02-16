"use client";

import React from "react";
import { Activity, Calendar, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zValidate } from "@/lib/validation/patient-data-validate";
import type { PatientCondition } from "@/drizzle/schemas/medical-background/patient_conditions";
import z from "zod";

const requiredString = z
  .string()
  .trim()
  .min(1, "Enter at least 1 character")
  .optional();
const statusSchema = z.enum(["Active", "Remission", "Resolved"]);
type ConditionStatus = z.infer<typeof statusSchema>;

type ConditionForm = {
  conditionName?: string | null;
  conditionStatus?: ConditionStatus | null;
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

interface ConditionsSectionProps {
  form: FormApi;
  patientId: string;
  isEditing: boolean;
  filteredConditions: PatientCondition[];
  formatDateForInput: (date: Date | string | null | undefined) => string;
  displayDate: (date: Date | string | null | undefined) => string;
  FieldError: FieldErrorComponent;
}

export default function ConditionsSection({
  form,
  patientId,
  isEditing,
  filteredConditions,
  formatDateForInput,
  displayDate,
  FieldError,
}: ConditionsSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Activity className="w-5 h-5 text-blue-500" />
        <h2 className="text-md font-bold uppercase tracking-wider text-muted-foreground">
          Conditions
        </h2>
      </div>

      {isEditing ? (
        <form.Field name="conditions" mode="array">
          {(fieldValue) => {
            const field = fieldValue as ArrayFieldApi<ConditionForm>;
            return (
              <div className="space-y-2">
                {field.state.value?.map((_, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-2 bg-card p-3 border rounded-lg"
                  >
                    <div className="flex flex-col sm:flex-row gap-2 items-start">
                      {/* Date Input */}
                      <form.Field name={`conditions[${i}].createdAt`}>
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
                        name={`conditions[${i}].conditionName`}
                        validators={{ onChange: zValidate(requiredString) }}
                      >
                        {(subValue) => {
                          const sub = subValue as SimpleFieldApi<
                            string | null | undefined
                          >;
                          return (
                            <div className="flex-1 w-full">
                              <Input
                                placeholder="Condition Name"
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
                        name={`conditions[${i}].conditionStatus`}
                        validators={{ onChange: zValidate(statusSchema) }}
                      >
                        {(subValue) => {
                          const sub = subValue as SimpleFieldApi<
                            ConditionStatus | null | undefined
                          >;
                          return (
                            <div className="w-full sm:w-40">
                              <select
                                className="h-9 px-2 border rounded-md text-sm bg-background w-full"
                                value={sub.state.value || "Active"}
                                onChange={(e) =>
                                  sub.handleChange(
                                    e.target.value as ConditionStatus,
                                  )
                                }
                              >
                                <option value="Active">Active</option>
                                <option value="Remission">Remission</option>
                                <option value="Resolved">Resolved</option>
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
                      conditionName: "",
                      conditionStatus: "Active",
                      patientId,
                      createdAt: new Date(),
                    })
                  }
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Condition
                </Button>
              </div>
            );
          }}
        </form.Field>
      ) : (
        <div className="space-y-2">
          {/* View Mode: Flat List */}
          {filteredConditions.length > 0 ? (
            filteredConditions?.map((c, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-3 border rounded-lg border-l-4 border-l-blue-500 bg-card"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-sm">{c.conditionName}</span>
                  {/* Date shown here */}
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {displayDate(c.createdAt)}
                  </span>
                </div>
                <Badge variant="outline">{c.conditionStatus}</Badge>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No conditions match the selected date.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

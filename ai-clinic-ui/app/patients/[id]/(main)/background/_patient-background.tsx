"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { Edit2, History, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { zValidate } from "@/lib/validation/patient-data-validate";
import z from "zod";

import { getPatientBackgroundById } from "@/lib/server/patient-background-by-id";
import { updatePatientRecord } from "@/actions/patient-actions/medical-record-actions";
import { formatDateLocal } from "@/lib/helpers/format-date-local";
import {
  AllergiesSection,
  ConditionsSection,
  MedicationsSection,
  SurgeriesSection,
} from "@/components/patient-form/shared-background-sections";
import type { PatientAllergy } from "@/drizzle/schemas/medical-background/patient_allergies";
import type { PatientCondition } from "@/drizzle/schemas/medical-background/patient_conditions";
import type { PatientMedication } from "@/drizzle/schemas/medical-background/patient_medications";
import type { PatientSurgery } from "@/drizzle/schemas/patient_surgeries";
import type { PatientSocialHistory } from "@/drizzle/schemas/medical-background/patient_social_history";

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

type BackgroundFormValues = {
  allergies: Partial<PatientAllergy>[];
  conditions: Partial<PatientCondition>[];
  medications: Partial<PatientMedication>[];
  surgeries: Partial<PatientSurgery>[];
  socialHistory: Partial<PatientSocialHistory>[];
};

type ArrayFieldApi<T> = {
  state: { value?: T[] };
  removeValue: (index: number) => void;
  pushValue: (value: T) => void;
};

type SimpleFieldApi<T> = {
  state: { value: T; meta: { errors: unknown[] } };
  handleChange: (value: T) => void;
  handleBlur: () => void;
};

type FieldErrorComponent = <T>(props: {
  field: SimpleFieldApi<T>;
}) => React.ReactNode;

export default function PatientBackgroundSection({
  patientId,
}: {
  patientId: string;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [dateFilter, setDateFilter] = useState<string>(""); // YYYY-MM-DD string

  const { data: patientBackgroundData, isLoading } = useQuery({
    queryKey: ["patient", "background", patientId],
    queryFn: () => getPatientBackgroundById({ patientId }),
    staleTime: 1000 * 60 * 5,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const form = useForm({
    defaultValues: (patientBackgroundData || {
      allergies: [],
      conditions: [],
      medications: [],
      surgeries: [],
      socialHistory: [],
    }) as BackgroundFormValues,
    onSubmit: async ({ value }) => {
      const result = await updatePatientRecord({
        patientId,
        data: {
          patientAllergies: value.allergies,
          patientConditions: value.conditions,
          patientMedications: value.medications,
          patientSurgeries: value.surgeries,
          patientSocialHistory: value.socialHistory,
        },
      });

      if (result.success) {
        setIsEditing(false);
      }
    },
  });

  // Sync data when query loads
  useEffect(() => {
    if (patientBackgroundData) {
      form.reset(patientBackgroundData);
    }
  }, [patientBackgroundData, form]);

  // --- UI HELPERS ---
  const getSeverityColor = (severity: string | null) => {
    const s = severity?.toLowerCase();
    if (s === "high" || s === "severe" || s === "life threatening")
      return "bg-destructive text-white";
    if (s === "moderate") return "bg-orange-500 text-white";
    if (s === "low" || s === "mild") return "bg-green-600 text-white";
    return "bg-slate-500 text-white";
  };

  // Helper to format Date objects for <Input type="date" /> (YYYY-MM-DD)
  const formatDateForInput = (date: Date | string | null | undefined) => {
    if (!date) return "";
    try {
      return new Date(date).toISOString().split("T")[0];
    } catch (e) {
      return e instanceof Error ? e.message : "Invalid date";
    }
  };

  // Helper to display date nicely in View Mode
  const displayDate = (date: Date | string | number | null | undefined) => {
    if (!date) return "No Date";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const FieldError: FieldErrorComponent = ({ field }) => {
    return field.state.meta.errors.length > 0 ? (
      <span className="text-[10px] text-destructive font-medium mt-1">
        {field.state.meta.errors.map((error) => String(error)).join(", ")}
      </span>
    ) : null;
  };

  const availableDates = React.useMemo(() => {
    if (!patientBackgroundData) return [];

    const dates = new Set<string>();

    const addDate = (value: Date | string | null | undefined) => {
      if (!value) return;
      try {
        dates.add(formatDateLocal(value));
      } catch {
        /* ignore invalid dates */
      }
    };

    patientBackgroundData.allergies.forEach((i) => addDate(i.createdAt));
    patientBackgroundData.conditions.forEach((i) => addDate(i.createdAt));
    patientBackgroundData.medications.forEach((i) => addDate(i.createdAt));
    patientBackgroundData.surgeries.forEach((i) => addDate(i.surgeryDate));

    return Array.from(dates).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime(),
    );
  }, [patientBackgroundData]);

  if (isLoading)
    return <div className="p-8 text-center animate-pulse">Loading...</div>;
  if (!patientBackgroundData) {
    return <div className="p-8 text-center">No background data found.</div>;
  }

  // --- FILTER LOGIC ---
  const filterByDate = <T,>(items: T[], dateKey: keyof T): T[] => {
    if (!dateFilter || !items) return items; // If no filter, show ALL
    return items.filter((item) => {
      const rawDate = item[dateKey];
      const itemDate = rawDate ? formatDateLocal(rawDate as Date | string) : "";
      return itemDate === dateFilter;
    });
  };
  const filteredAllergies = filterByDate(
    patientBackgroundData?.allergies || [],
    "createdAt",
  );
  const filteredConditions = filterByDate(
    patientBackgroundData?.conditions || [],
    "createdAt",
  );
  const filteredMedications = filterByDate(
    patientBackgroundData?.medications || [],
    "createdAt",
  );

  return (
    <div className="space-y-4 sm:space-y-6 p-0 sm:p-2">
      {/* HEADER ACTIONS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-muted/30 p-2.5 sm:p-3 rounded-xl border border-dashed gap-2 sm:gap-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          <h1 className="text-sm sm:text-base font-bold tracking-tight">
            Medical Background
          </h1>
        </div>
        {!isEditing && (
          <div className="relative">
            <select
              className="h-8 w-full sm:w-40 text-xs bg-background border border-input rounded-md px-2 focus:ring-1 focus:ring-ring"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="">All Dates</option>
              <optgroup label="Available Records">
                {availableDates.map((date) => (
                  <option key={date} value={date}>
                    {new Date(date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </option>
                ))}
              </optgroup>
            </select>
            {/* Clear Filter Button (only shows if filter is active) */}
            {dateFilter && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-8 top-0 h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setDateFilter("")}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        )}
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  form.reset();
                  setIsEditing(false);
                }}
                className="h-8"
              >
                <X className="w-4 h-4 mr-1" /> Cancel
              </Button>
              <Button
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}
                className="h-8 bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4 mr-1" /> Save
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-8"
            >
              <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
            </Button>
          )}
        </div>
      </div>

      {/* 1. ALLERGIES SECTION */}
      <form.Field name="allergies" mode="array">
        {(fieldValue) => {
          const field = fieldValue as ArrayFieldApi<Partial<PatientAllergy>>;
          return (
            <AllergiesSection
              fields={isEditing ? field.state.value || [] : filteredAllergies}
              isEditing={isEditing}
              onAdd={() =>
                field.pushValue({
                  allergen: "",
                  severity: "Mild",
                  patientId,
                  createdAt: new Date(),
                })
              }
              onRemove={(i) => field.removeValue(i)}
              renderField={(index, fieldName) => {
                if (fieldName === "createdAt") {
                  return (
                    <form.Field name={`allergies[${index}].createdAt`}>
                      {(subValue) => {
                        const sub = subValue as unknown as SimpleFieldApi<
                          Date | string | null
                        >;
                        return (
                          <Input
                            type="date"
                            className="h-9 text-xs"
                            value={formatDateForInput(sub.state.value)}
                            onChange={(e) =>
                              sub.handleChange(new Date(e.target.value))
                            }
                          />
                        );
                      }}
                    </form.Field>
                  );
                }
                if (fieldName === "allergen") {
                  return (
                    <form.Field
                      name={`allergies[${index}].allergen`}
                      validators={{ onChange: zValidate(requiredString) }}
                    >
                      {(subValue) => {
                        const sub = subValue as unknown as SimpleFieldApi<
                          string | null | undefined
                        >;
                        return (
                          <div className="w-full">
                            <Input
                              placeholder="Allergen Name"
                              className="h-9"
                              value={sub.state.value ?? ""}
                              onChange={(e) => sub.handleChange(e.target.value)}
                              onBlur={sub.handleBlur}
                            />
                            <FieldError field={sub} />
                          </div>
                        );
                      }}
                    </form.Field>
                  );
                }
                if (fieldName === "severity") {
                  return (
                    <form.Field
                      name={`allergies[${index}].severity`}
                      validators={{ onChange: zValidate(severitySchema) }}
                    >
                      {(subValue) => {
                        const sub = subValue as unknown as SimpleFieldApi<
                          string | null | undefined
                        >;
                        return (
                          <select
                            className="h-9 px-2 border rounded-md text-sm bg-background w-full"
                            value={sub.state.value || "Mild"}
                            onChange={(e) => sub.handleChange(e.target.value)}
                            onBlur={sub.handleBlur}
                          >
                            <option value="Mild">Mild</option>
                            <option value="Moderate">Moderate</option>
                            <option value="Severe">Severe</option>
                            <option value="Life Threatening">
                              Life Threatening
                            </option>
                          </select>
                        );
                      }}
                    </form.Field>
                  );
                }
              }}
              getSeverityColor={getSeverityColor}
              displayDate={displayDate}
            />
          );
        }}
      </form.Field>

      <Separator />

      {/* 2. CONDITIONS SECTION */}
      <form.Field name="conditions" mode="array">
        {(fieldValue) => {
          const field = fieldValue as ArrayFieldApi<Partial<PatientCondition>>;
          return (
            <ConditionsSection
              fields={isEditing ? field.state.value || [] : filteredConditions}
              isEditing={isEditing}
              onAdd={() =>
                field.pushValue({
                  conditionName: "",
                  conditionStatus: "Active",
                  patientId,
                  createdAt: new Date(),
                })
              }
              onRemove={(i) => field.removeValue(i)}
              renderField={(index, fieldName) => {
                if (fieldName === "createdAt") {
                  return (
                    <form.Field name={`conditions[${index}].createdAt`}>
                      {(subValue) => {
                        const sub = subValue as unknown as SimpleFieldApi<
                          Date | string | null
                        >;
                        return (
                          <Input
                            type="date"
                            className="h-10 text-xs"
                            value={formatDateForInput(sub.state.value)}
                            onChange={(e) =>
                              sub.handleChange(new Date(e.target.value))
                            }
                          />
                        );
                      }}
                    </form.Field>
                  );
                }
                if (fieldName === "conditionName") {
                  return (
                    <form.Field
                      name={`conditions[${index}].conditionName`}
                      validators={{ onChange: zValidate(requiredString) }}
                    >
                      {(subValue) => {
                        const sub = subValue as unknown as SimpleFieldApi<
                          string | null | undefined
                        >;
                        return (
                          <div>
                            <Input
                              placeholder="e.g. Hypertension"
                              value={sub.state.value ?? ""}
                              onChange={(e) => sub.handleChange(e.target.value)}
                              onBlur={sub.handleBlur}
                            />
                            <FieldError field={sub} />
                          </div>
                        );
                      }}
                    </form.Field>
                  );
                }
                if (fieldName === "conditionStatus") {
                  return (
                    <form.Field name={`conditions[${index}].conditionStatus`}>
                      {(subValue) => {
                        const sub = subValue as unknown as SimpleFieldApi<
                          string | null | undefined
                        >;
                        return (
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            value={sub.state.value || "Active"}
                            onChange={(e) => sub.handleChange(e.target.value)}
                          >
                            <option value="Active">Active</option>
                            <option value="Remission">Remission</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                        );
                      }}
                    </form.Field>
                  );
                }
              }}
              displayDate={displayDate}
            />
          );
        }}
      </form.Field>

      <Separator />

      {/* 3. MEDICATIONS SECTION */}
      <form.Field name="medications" mode="array">
        {(fieldValue) => {
          const field = fieldValue as ArrayFieldApi<Partial<PatientMedication>>;
          return (
            <MedicationsSection
              fields={isEditing ? field.state.value || [] : filteredMedications}
              isEditing={isEditing}
              onAdd={() =>
                field.pushValue({
                  drugName: "",
                  dosage: "",
                  frequency: "",
                  patientId,
                  createdAt: new Date(),
                })
              }
              onRemove={(i) => field.removeValue(i)}
              renderField={(index, fieldName) => {
                if (fieldName === "createdAt") {
                  return (
                    <form.Field name={`medications[${index}].createdAt`}>
                      {(subValue) => {
                        const sub = subValue as unknown as SimpleFieldApi<
                          Date | string | null
                        >;
                        return (
                          <Input
                            type="date"
                            className="h-9 text-xs"
                            value={formatDateForInput(sub.state.value)}
                            onChange={(e) =>
                              sub.handleChange(new Date(e.target.value))
                            }
                          />
                        );
                      }}
                    </form.Field>
                  );
                }
                if (fieldName === "drugName") {
                  return (
                    <form.Field
                      name={`medications[${index}].drugName`}
                      validators={{ onChange: zValidate(requiredString) }}
                    >
                      {(subValue) => {
                        const sub = subValue as unknown as SimpleFieldApi<
                          string | null | undefined
                        >;
                        return (
                          <div>
                            <Input
                              placeholder="Drug Name"
                              className="h-9"
                              value={sub.state.value ?? ""}
                              onChange={(e) => sub.handleChange(e.target.value)}
                              onBlur={sub.handleBlur}
                            />
                            <FieldError field={sub} />
                          </div>
                        );
                      }}
                    </form.Field>
                  );
                }
                if (fieldName === "dosage") {
                  return (
                    <form.Field name={`medications[${index}].dosage`}>
                      {(subValue) => {
                        const sub = subValue as unknown as SimpleFieldApi<
                          string | null | undefined
                        >;
                        return (
                          <Input
                            placeholder="Dosage"
                            className="h-9"
                            value={sub.state.value ?? ""}
                            onChange={(e) => sub.handleChange(e.target.value)}
                          />
                        );
                      }}
                    </form.Field>
                  );
                }
              }}
              displayDate={displayDate}
            />
          );
        }}
      </form.Field>

      <Separator />

      {/* 4. SURGERIES (Read Only - Link to Surgery Page) */}
      <SurgeriesSection
        fields={patientBackgroundData?.surgeries || []}
        isEditing={false}
        displayDate={displayDate}
        onSurgeryClick={(surgery) => {
          router.push(`/patients/${patientId}/surgery?surgeryId=${surgery.id}`);
        }}
      />
    </div>
  );
}

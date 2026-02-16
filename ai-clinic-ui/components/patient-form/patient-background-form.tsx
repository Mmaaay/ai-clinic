"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zValidate } from "@/lib/validation/patient-data-validate";
import z from "zod";
import {
  AllergiesSection,
  ConditionsSection,
  MedicationsSection,
  SurgeriesSection,
  SocialHistorySection,
} from "./shared-background-sections";
import { withForm, medicalRecordFormOpts } from "@/lib/tansack-form";

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

type IdValue = string | number;
type DateValue = Date | string | number | null | undefined;

interface AllergyItem {
  id?: IdValue;
  allergen?: string | null;
  severity?: string | null;
  reaction?: string | null;
  createdAt?: DateValue;
}

interface ConditionItem {
  id?: IdValue;
  conditionName?: string | null;
  conditionStatus?: string | null;
  notes?: string | null;
  createdAt?: DateValue;
}

interface MedicationItem {
  id?: IdValue;
  drugName?: string | null;
  dosage?: string | null;
  frequency?: string | null;
  createdAt?: DateValue;
}

interface SurgeryItem {
  id?: IdValue;
  procedureName?: string | null;
  procedureType?: string | null;
  surgeryDate?: DateValue;
  hospitalName?: string | null;
  surgeonName?: string | null;
  firstAssistant?: string | null;
  secondAssistant?: string | null;
  dissectionBy?: string | null;
  cameraMan?: string | null;
  operativeNotes?: string | null;
  summaryNotes?: string | null;
}

interface SocialHistoryItem {
  id?: IdValue;
  category?: string | null;
  value?: string | null;
}

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

const PatientBackgroundForm = withForm({
  ...medicalRecordFormOpts,
  render: function Render({ form }) {
    const formatDateForInput = (date: DateValue) => {
      if (!date) return "";
      try {
        return new Date(date).toISOString().split("T")[0];
      } catch {
        return "";
      }
    };

    const displayDate = (date: DateValue) => {
      if (!date) return "";
      try {
        return new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      } catch {
        return "";
      }
    };

    const FieldError: FieldErrorComponent = ({ field }) => {
      return field.state.meta.errors.length > 0 ? (
        <span className="text-[10px] text-destructive font-medium mt-1">
          {field.state.meta.errors.map((error) => String(error)).join(", ")}
        </span>
      ) : null;
    };

    return (
      <div className="flex flex-col h-full max-h-[85vh]">
        <div className="flex items-center justify-between mb-4 px-1">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              Comprehensive Patient History
            </h2>
            <p className="text-xs text-muted-foreground">
              All changes are auto-saved to form state
            </p>
          </div>
        </div>

        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-6 pb-10 px-1">
            <form.Field name="patientAllergies" mode="array">
              {(fieldValue) => {
                const field = fieldValue as ArrayFieldApi<Partial<AllergyItem>>;
                return (
                  <AllergiesSection
                    fields={field.state.value || []}
                    isEditing={true}
                    onAdd={() =>
                      field.pushValue({
                        allergen: "",
                        severity: "Mild",
                        reaction: "",
                        createdAt: new Date(),
                      })
                    }
                    onRemove={(i) => field.removeValue(i)}
                    renderField={(index, fieldName) => {
                      if (fieldName === "createdAt") {
                        return (
                          <form.Field
                            name={`patientAllergies[${index}].createdAt`}
                          >
                            {(subValue) => {
                              const sub = subValue as SimpleFieldApi<DateValue>;
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
                            name={`patientAllergies[${index}].allergen`}
                            validators={{ onChange: zValidate(requiredString) }}
                          >
                            {(subValue) => {
                              const sub = subValue as SimpleFieldApi<
                                string | null | undefined
                              >;
                              return (
                                <div className="w-full">
                                  <Input
                                    placeholder="Allergen (e.g. Peanuts)"
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
                        );
                      }
                      if (fieldName === "severity") {
                        return (
                          <form.Field
                            name={`patientAllergies[${index}].severity`}
                            validators={{ onChange: zValidate(severitySchema) }}
                          >
                            {(subValue) => {
                              const sub = subValue as SimpleFieldApi<
                                string | null | undefined
                              >;
                              return (
                                <select
                                  className="h-9 px-2 border rounded-md text-sm bg-background w-full"
                                  value={sub.state.value || "Mild"}
                                  onChange={(e) =>
                                    sub.handleChange(e.target.value)
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

            <form.Field name="patientConditions" mode="array">
              {(fieldValue) => {
                const field = fieldValue as ArrayFieldApi<
                  Partial<ConditionItem>
                >;
                return (
                  <ConditionsSection
                    fields={field.state.value || []}
                    isEditing={true}
                    onAdd={() =>
                      field.pushValue({
                        conditionName: "",
                        conditionStatus: "Active",
                        notes: "",
                        createdAt: new Date(),
                      })
                    }
                    onRemove={(i) => field.removeValue(i)}
                    renderField={(index, fieldName) => {
                      if (fieldName === "createdAt") {
                        return (
                          <form.Field
                            name={`patientConditions[${index}].createdAt`}
                          >
                            {(subValue) => {
                              const sub = subValue as SimpleFieldApi<DateValue>;
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
                            name={`patientConditions[${index}].conditionName`}
                            validators={{ onChange: zValidate(requiredString) }}
                          >
                            {(subValue) => {
                              const sub = subValue as SimpleFieldApi<
                                string | null | undefined
                              >;
                              return (
                                <div>
                                  <Input
                                    placeholder="e.g. Hypertension"
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
                        );
                      }
                      if (fieldName === "conditionStatus") {
                        return (
                          <form.Field
                            name={`patientConditions[${index}].conditionStatus`}
                          >
                            {(subValue) => {
                              const sub = subValue as SimpleFieldApi<
                                string | null | undefined
                              >;
                              return (
                                <select
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                  value={sub.state.value || "Active"}
                                  onChange={(e) =>
                                    sub.handleChange(e.target.value)
                                  }
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

            <form.Field name="patientMedications" mode="array">
              {(fieldValue) => {
                const field = fieldValue as ArrayFieldApi<
                  Partial<MedicationItem>
                >;
                return (
                  <MedicationsSection
                    fields={field.state.value || []}
                    isEditing={true}
                    onAdd={() =>
                      field.pushValue({
                        drugName: "",
                        dosage: "",
                        frequency: "",
                        createdAt: new Date(),
                      })
                    }
                    onRemove={(i) => field.removeValue(i)}
                    renderField={(index, fieldName) => {
                      if (fieldName === "createdAt") {
                        return (
                          <form.Field
                            name={`patientMedications[${index}].createdAt`}
                          >
                            {(subValue) => {
                              const sub = subValue as SimpleFieldApi<DateValue>;
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
                            name={`patientMedications[${index}].drugName`}
                            validators={{ onChange: zValidate(requiredString) }}
                          >
                            {(subValue) => {
                              const sub = subValue as SimpleFieldApi<
                                string | null | undefined
                              >;
                              return (
                                <div>
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
                        );
                      }
                      if (fieldName === "dosage") {
                        return (
                          <form.Field
                            name={`patientMedications[${index}].dosage`}
                          >
                            {(subValue) => {
                              const sub = subValue as SimpleFieldApi<
                                string | null | undefined
                              >;
                              return (
                                <Input
                                  placeholder="Dosage"
                                  className="h-9"
                                  value={sub.state.value ?? ""}
                                  onChange={(e) =>
                                    sub.handleChange(e.target.value)
                                  }
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

            <form.Field name="patientSurgeries" mode="array">
              {(fieldValue) => {
                const field = fieldValue as ArrayFieldApi<Partial<SurgeryItem>>;
                return (
                  <SurgeriesSection
                    fields={field.state.value || []}
                    isEditing={true}
                    onAdd={() =>
                      field.pushValue({
                        procedureName: "",
                        procedureType: "Other",
                        surgeryDate: "",
                        hospitalName: "",
                        surgeonName: "",
                        firstAssistant: "",
                        secondAssistant: "",
                        dissectionBy: "",
                        cameraMan: "",
                        operativeNotes: "",
                        summaryNotes: "",
                      })
                    }
                    onRemove={(i) => field.removeValue(i)}
                    renderField={(index, fieldName) => {
                      if (fieldName === "procedureName") {
                        return (
                          <form.Field
                            name={`patientSurgeries[${index}].procedureName`}
                          >
                            {(subValue) => {
                              const sub = subValue as SimpleFieldApi<
                                string | null | undefined
                              >;
                              return (
                                <Input
                                  placeholder="e.g. Appendectomy"
                                  value={sub.state.value ?? ""}
                                  onChange={(e) =>
                                    sub.handleChange(e.target.value)
                                  }
                                />
                              );
                            }}
                          </form.Field>
                        );
                      }
                      if (fieldName === "procedureType") {
                        return (
                          <form.Field
                            name={`patientSurgeries[${index}].procedureType`}
                          >
                            {(subValue) => {
                              const sub = subValue as SimpleFieldApi<
                                string | null | undefined
                              >;
                              return (
                                <select
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                  value={sub.state.value || "Other"}
                                  onChange={(e) =>
                                    sub.handleChange(e.target.value)
                                  }
                                >
                                  <option value="Sleeve Gastrectomy">
                                    Sleeve Gastrectomy
                                  </option>
                                  <option value="Gastric Bypass (RNY)">
                                    Gastric Bypass (RNY)
                                  </option>
                                  <option value="Mini Gastric Bypass (MGB)">
                                    Mini Gastric Bypass (MGB)
                                  </option>
                                  <option value="SASI">SASI</option>
                                  <option value="Gastric Balloon">
                                    Gastric Balloon
                                  </option>
                                  <option value="Revisional Surgery">
                                    Revisional Surgery
                                  </option>
                                  <option value="Other">Other</option>
                                </select>
                              );
                            }}
                          </form.Field>
                        );
                      }
                      if (fieldName === "surgeryDate") {
                        return (
                          <form.Field
                            name={`patientSurgeries[${index}].surgeryDate`}
                          >
                            {(subValue) => {
                              const sub = subValue as SimpleFieldApi<DateValue>;
                              return (
                                <Input
                                  type="date"
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
                      if (fieldName === "hospitalName") {
                        return (
                          <form.Field
                            name={`patientSurgeries[${index}].hospitalName`}
                          >
                            {(subValue) => {
                              const sub = subValue as SimpleFieldApi<
                                string | null | undefined
                              >;
                              return (
                                <Input
                                  placeholder="Hospital or clinic name"
                                  value={sub.state.value ?? ""}
                                  onChange={(e) =>
                                    sub.handleChange(e.target.value)
                                  }
                                />
                              );
                            }}
                          </form.Field>
                        );
                      }
                      if (fieldName === "surgeonName") {
                        return (
                          <form.Field
                            name={`patientSurgeries[${index}].surgeonName`}
                          >
                            {(subValue) => {
                              const sub = subValue as SimpleFieldApi<
                                string | null | undefined
                              >;
                              return (
                                <Input
                                  placeholder="Dr. Surgeon Name"
                                  value={sub.state.value ?? ""}
                                  onChange={(e) =>
                                    sub.handleChange(e.target.value)
                                  }
                                />
                              );
                            }}
                          </form.Field>
                        );
                      }
                      if (fieldName === "firstAssistant") {
                        return (
                          <form.Field
                            name={`patientSurgeries[${index}].firstAssistant`}
                          >
                            {(subValue) => {
                              const sub = subValue as SimpleFieldApi<
                                string | null | undefined
                              >;
                              return (
                                <Input
                                  placeholder="Assistant name"
                                  value={sub.state.value ?? ""}
                                  onChange={(e) =>
                                    sub.handleChange(e.target.value)
                                  }
                                />
                              );
                            }}
                          </form.Field>
                        );
                      }
                      if (fieldName === "secondAssistant") {
                        return (
                          <form.Field
                            name={`patientSurgeries[${index}].secondAssistant`}
                          >
                            {(subValue) => {
                              const sub = subValue as SimpleFieldApi<
                                string | null | undefined
                              >;
                              return (
                                <Input
                                  placeholder="Assistant name"
                                  value={sub.state.value ?? ""}
                                  onChange={(e) =>
                                    sub.handleChange(e.target.value)
                                  }
                                />
                              );
                            }}
                          </form.Field>
                        );
                      }
                      if (fieldName === "dissectionBy") {
                        return (
                          <form.Field
                            name={`patientSurgeries[${index}].dissectionBy`}
                          >
                            {(subValue) => {
                              const sub = subValue as SimpleFieldApi<
                                string | null | undefined
                              >;
                              return (
                                <Input
                                  placeholder="Person who performed dissection"
                                  value={sub.state.value ?? ""}
                                  onChange={(e) =>
                                    sub.handleChange(e.target.value)
                                  }
                                />
                              );
                            }}
                          </form.Field>
                        );
                      }
                      if (fieldName === "cameraMan") {
                        return (
                          <form.Field
                            name={`patientSurgeries[${index}].cameraMan`}
                          >
                            {(subValue) => {
                              const sub = subValue as SimpleFieldApi<
                                string | null | undefined
                              >;
                              return (
                                <Input
                                  placeholder="Person handling camera"
                                  value={sub.state.value ?? ""}
                                  onChange={(e) =>
                                    sub.handleChange(e.target.value)
                                  }
                                />
                              );
                            }}
                          </form.Field>
                        );
                      }
                      if (fieldName === "operativeNotes") {
                        return (
                          <form.Field
                            name={`patientSurgeries[${index}].operativeNotes`}
                          >
                            {(subValue) => {
                              const sub = subValue as SimpleFieldApi<
                                string | null | undefined
                              >;
                              return (
                                <Textarea
                                  rows={4}
                                  className="resize-none"
                                  placeholder="Detailed operative report..."
                                  value={sub.state.value ?? ""}
                                  onChange={(e) =>
                                    sub.handleChange(e.target.value)
                                  }
                                />
                              );
                            }}
                          </form.Field>
                        );
                      }
                      if (fieldName === "summaryNotes") {
                        return (
                          <form.Field
                            name={`patientSurgeries[${index}].summaryNotes`}
                          >
                            {(subValue) => {
                              const sub = subValue as SimpleFieldApi<
                                string | null | undefined
                              >;
                              return (
                                <Textarea
                                  rows={4}
                                  className="resize-none"
                                  placeholder="Brief summary for quick reference..."
                                  value={sub.state.value ?? ""}
                                  onChange={(e) =>
                                    sub.handleChange(e.target.value)
                                  }
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

            <form.Field name="patientSocialHistory" mode="array">
              {(fieldValue) => {
                const field = fieldValue as ArrayFieldApi<
                  Partial<SocialHistoryItem>
                >;
                return (
                  <SocialHistorySection
                    fields={field.state.value || []}
                    isEditing={true}
                    onAdd={() =>
                      field.pushValue({
                        category: "Smoking",
                        value: "",
                      })
                    }
                    onRemove={(i) => field.removeValue(i)}
                    renderField={(index, fieldName) => {
                      if (fieldName === "category") {
                        return (
                          <form.Field
                            name={`patientSocialHistory[${index}].category`}
                          >
                            {(subValue) => {
                              const sub = subValue as SimpleFieldApi<
                                string | null | undefined
                              >;
                              return (
                                <select
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                  value={sub.state.value || "Smoking"}
                                  onChange={(e) =>
                                    sub.handleChange(e.target.value)
                                  }
                                >
                                  <option value="Smoking">Smoking</option>
                                  <option value="Alcohol">Alcohol</option>
                                  <option value="Diet">Diet</option>
                                  <option value="Exercise">Exercise</option>
                                  <option value="Occupation">Occupation</option>
                                </select>
                              );
                            }}
                          </form.Field>
                        );
                      }
                      if (fieldName === "value") {
                        return (
                          <form.Field
                            name={`patientSocialHistory[${index}].value`}
                          >
                            {(subValue) => {
                              const sub = subValue as SimpleFieldApi<
                                string | null | undefined
                              >;
                              return (
                                <Input
                                  placeholder="e.g. 1 pack/day"
                                  value={sub.state.value ?? ""}
                                  onChange={(e) =>
                                    sub.handleChange(e.target.value)
                                  }
                                />
                              );
                            }}
                          </form.Field>
                        );
                      }
                    }}
                  />
                );
              }}
            </form.Field>
          </div>
        </ScrollArea>
      </div>
    );
  },
});

export default PatientBackgroundForm;

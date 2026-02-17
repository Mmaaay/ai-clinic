"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Trash2,
  Plus,
  CalendarDays,
  Stethoscope,
  User,
  Building,
} from "lucide-react";
import { withForm, medicalRecordFormOpts } from "@/lib/tansack-form";

type DateValue = Date | string | null | undefined;

interface PatientSurgeryForm {
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

interface ArrayFieldApi<TValue> {
  state: { value: TValue[] | undefined };
  pushValue: (value: TValue) => void;
  removeValue: (index: number) => void;
}

interface ValueFieldApi<TValue> {
  state: { value: TValue };
  handleChange: (value: TValue) => void;
}

const asArrayField = (field: unknown): ArrayFieldApi<PatientSurgeryForm> =>
  field as ArrayFieldApi<PatientSurgeryForm>;

const asValueField = <TValue,>(field: unknown): ValueFieldApi<TValue> =>
  field as ValueFieldApi<TValue>;

const SurgeriesForm = withForm({
  ...medicalRecordFormOpts,
  render: function Render({ form }) {
    return (
      <div className="flex flex-col h-full max-h-[85vh]">
        <div className="flex items-center justify-between mb-4 px-1">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              Surgical History
            </h2>
            <p className="text-xs text-muted-foreground">
              Record past surgical procedures and details.
            </p>
          </div>
        </div>

        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-6 pb-10 px-1">
            <SurgeriesArray form={form} />
          </div>
        </ScrollArea>
      </div>
    );
  },
});

function SurgeriesArray({
  form,
}: {
  form: Parameters<typeof SurgeriesForm>[0]["form"];
}) {
  return (
    <form.Field name="patientSurgeries" mode="array">
      {(field: unknown) => {
        const arrayField = asArrayField(field);

        return (
          <Card className="border-blue-100 dark:border-blue-900/30">
            <CardHeader className="flex flex-row items-center justify-between py-4 bg-blue-50/50 dark:bg-blue-900/10">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-base">Surgical Procedures</CardTitle>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900"
                onClick={() =>
                  arrayField.pushValue({
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
              >
                <Plus className="w-4 h-4 mr-1" /> New Surgery
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-6">
              {(arrayField.state.value || []).map(
                (_: PatientSurgeryForm, index: number) => (
                  <div
                    key={index}
                    className="relative p-5 border rounded-xl bg-card shadow-sm group"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-3 right-3 h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                      onClick={() => arrayField.removeValue(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>

                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">
                            Procedure Name
                          </label>
                          <form.Field
                            name={`patientSurgeries[${index}].procedureName`}
                          >
                            {(sub: unknown) => {
                              const subField = asValueField<string>(sub);

                              return (
                                <Input
                                  placeholder="e.g., Lap Cholecystectomy"
                                  value={subField.state.value || ""}
                                  onChange={(e) =>
                                    subField.handleChange(e.target.value)
                                  }
                                />
                              );
                            }}
                          </form.Field>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">
                            Procedure Type
                          </label>
                          <form.Field
                            name={`patientSurgeries[${index}].procedureType`}
                          >
                            {(sub: unknown) => {
                              const subField = asValueField<string>(sub);

                              return (
                                <select
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                  value={subField.state.value || "Other"}
                                  onChange={(e) =>
                                    subField.handleChange(e.target.value)
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
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" /> Surgery Date
                          </label>
                          <form.Field
                            name={`patientSurgeries[${index}].surgeryDate`}
                          >
                            {(sub: unknown) => {
                              const subField = asValueField<DateValue>(sub);

                              return (
                                <Input
                                  type="date"
                                  value={
                                    subField.state.value
                                      ? new Date(subField.state.value)
                                          .toISOString()
                                          .split("T")[0]
                                      : ""
                                  }
                                  onChange={(e) =>
                                    subField.handleChange(e.target.value)
                                  }
                                />
                              );
                            }}
                          </form.Field>
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                            <Building className="w-3 h-3" /> Hospital Name
                          </label>
                          <form.Field
                            name={`patientSurgeries[${index}].hospitalName`}
                          >
                            {(sub: unknown) => {
                              const subField = asValueField<string>(sub);

                              return (
                                <Input
                                  placeholder="Hospital or clinic name"
                                  value={subField.state.value || ""}
                                  onChange={(e) =>
                                    subField.handleChange(e.target.value)
                                  }
                                />
                              );
                            }}
                          </form.Field>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                            <User className="w-3 h-3" /> Surgeon Name
                          </label>
                          <form.Field
                            name={`patientSurgeries[${index}].surgeonName`}
                          >
                            {(sub: unknown) => {
                              const subField = asValueField<string>(sub);

                              return (
                                <Input
                                  placeholder="Dr. Surgeon Name"
                                  value={subField.state.value || ""}
                                  onChange={(e) =>
                                    subField.handleChange(e.target.value)
                                  }
                                />
                              );
                            }}
                          </form.Field>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">
                            First Assistant
                          </label>
                          <form.Field
                            name={`patientSurgeries[${index}].firstAssistant`}
                          >
                            {(sub: unknown) => {
                              const subField = asValueField<string>(sub);

                              return (
                                <Input
                                  placeholder="Assistant name"
                                  value={subField.state.value || ""}
                                  onChange={(e) =>
                                    subField.handleChange(e.target.value)
                                  }
                                />
                              );
                            }}
                          </form.Field>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">
                            Second Assistant
                          </label>
                          <form.Field
                            name={`patientSurgeries[${index}].secondAssistant`}
                          >
                            {(sub: unknown) => {
                              const subField = asValueField<string>(sub);

                              return (
                                <Input
                                  placeholder="Assistant name"
                                  value={subField.state.value || ""}
                                  onChange={(e) =>
                                    subField.handleChange(e.target.value)
                                  }
                                />
                              );
                            }}
                          </form.Field>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">
                            Dissection By
                          </label>
                          <form.Field
                            name={`patientSurgeries[${index}].dissectionBy`}
                          >
                            {(sub: unknown) => {
                              const subField = asValueField<string>(sub);

                              return (
                                <Input
                                  placeholder="Person who performed dissection"
                                  value={subField.state.value || ""}
                                  onChange={(e) =>
                                    subField.handleChange(e.target.value)
                                  }
                                />
                              );
                            }}
                          </form.Field>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">
                          Camera Man
                        </label>
                        <form.Field
                          name={`patientSurgeries[${index}].cameraMan`}
                        >
                          {(sub: unknown) => {
                            const subField = asValueField<string>(sub);

                            return (
                              <Input
                                placeholder="Person handling camera"
                                value={subField.state.value || ""}
                                onChange={(e) =>
                                  subField.handleChange(e.target.value)
                                }
                              />
                            );
                          }}
                        </form.Field>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">
                            Operative Notes
                          </label>
                          <form.Field
                            name={`patientSurgeries[${index}].operativeNotes`}
                          >
                            {(sub: unknown) => {
                              const subField = asValueField<string>(sub);

                              return (
                                <Textarea
                                  rows={6}
                                  className="resize-none"
                                  placeholder="Detailed operative report..."
                                  value={subField.state.value || ""}
                                  onChange={(e) =>
                                    subField.handleChange(e.target.value)
                                  }
                                />
                              );
                            }}
                          </form.Field>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">
                            Summary Notes
                          </label>
                          <form.Field
                            name={`patientSurgeries[${index}].summaryNotes`}
                          >
                            {(sub: unknown) => {
                              const subField = asValueField<string>(sub);

                              return (
                                <Textarea
                                  rows={6}
                                  className="resize-none"
                                  placeholder="Brief summary for quick reference..."
                                  value={subField.state.value || ""}
                                  onChange={(e) =>
                                    subField.handleChange(e.target.value)
                                  }
                                />
                              );
                            }}
                          </form.Field>
                        </div>
                      </div>
                    </div>
                  </div>
                ),
              )}

              {(arrayField.state.value || []).length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/5">
                  <Stethoscope className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm">No surgeries recorded yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      }}
    </form.Field>
  );
}

export default SurgeriesForm;

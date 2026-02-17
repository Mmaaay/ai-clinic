"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Activity, CalendarDays, Plus, Scale, Trash2 } from "lucide-react";
import { withForm, medicalRecordFormOpts } from "@/lib/tansack-form";

type DateValue = Date | string | null | undefined;

interface PatientVisitForm {
  visitDate?: DateValue;
  visitType?: string | null;
  urgentPurpose?: string | null;
  weight?: string | null;
  bmi?: string | null;
  woundStatus?: string | null;
  clinicalFindings?: string | null;
  newPrescriptions?: string | null;
  investigationsOrdered?: string | null;
  recommendations?: string | null;
  nextAppointmentDate?: DateValue;
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

const asArrayField = (field: unknown): ArrayFieldApi<PatientVisitForm> =>
  field as ArrayFieldApi<PatientVisitForm>;

const asValueField = <TValue,>(field: unknown): ValueFieldApi<TValue> =>
  field as ValueFieldApi<TValue>;

const VisitsForm = withForm({
  ...medicalRecordFormOpts,
  render: function Render({ form }) {
    return (
      <div className="flex flex-col h-full max-h-[85vh]">
        <div className="flex items-center justify-between mb-4 px-1">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              Clinical Visits
            </h2>
            <p className="text-xs text-muted-foreground">
              Log consultations, emergency visits, and daily rounds.
            </p>
          </div>
        </div>

        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-6 pb-10 px-1">
            <VisitsArray form={form} />
          </div>
        </ScrollArea>
      </div>
    );
  },
});

function VisitsArray({
  form,
}: {
  form: Parameters<typeof VisitsForm>[0]["form"];
}) {
  return (
    <form.Field name="patientVisits" mode="array">
      {(field: unknown) => {
        const arrayField = asArrayField(field);

        return (
          <Card className="border-cyan-100 dark:border-cyan-900/30">
            <CardHeader className="flex flex-row items-center justify-between py-4 bg-cyan-50/50 dark:bg-cyan-900/10">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-cyan-600" />
                <CardTitle className="text-base">Encounter History</CardTitle>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="hover:bg-cyan-100 hover:text-cyan-700 dark:hover:bg-cyan-900"
                onClick={() =>
                  arrayField.pushValue({
                    visitDate: new Date().toISOString().split("T")[0],
                    visitType: "Routine",
                    urgentPurpose: "",
                    weight: "",
                    bmi: "",
                    woundStatus: "Clean",
                    clinicalFindings: "",
                    newPrescriptions: "",
                    investigationsOrdered: "",
                    recommendations: "",
                    nextAppointmentDate: "",
                  })
                }
              >
                <Plus className="w-4 h-4 mr-1" /> New Visit
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-6">
              {(arrayField.state.value || []).map(
                (_: PatientVisitForm, index: number) => (
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
                            Date
                          </label>
                          <form.Field
                            name={`patientVisits[${index}].visitDate`}
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
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">
                            Type
                          </label>
                          <form.Field
                            name={`patientVisits[${index}].visitType`}
                          >
                            {(sub: unknown) => {
                              const subField = asValueField<string>(sub);

                              return (
                                <select
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                                  value={subField.state.value || "Routine"}
                                  onChange={(e) =>
                                    subField.handleChange(e.target.value)
                                  }
                                >
                                  <option value="Routine">Routine</option>
                                  <option value="Urgent">Urgent</option>
                                </select>
                              );
                            }}
                          </form.Field>
                        </div>
                        <div className="space-y-1.5 sm:pr-8">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">
                            Urgent Purpose
                          </label>
                          <form.Field
                            name={`patientVisits[${index}].urgentPurpose`}
                          >
                            {(sub: unknown) => {
                              const subField = asValueField<string>(sub);

                              return (
                                <Input
                                  placeholder="Reason for urgent visit"
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

                      <Separator />

                      <div className="bg-muted/10 p-3 rounded-lg border border-dashed border-cyan-200 dark:border-cyan-800">
                        <div className="text-xs font-bold text-cyan-600 uppercase mb-3 flex items-center gap-2">
                          <Activity className="w-3 h-3" />
                          <span>Vitals & Measurements</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] text-cyan-600 font-bold uppercase flex items-center gap-1">
                              <Scale className="w-3 h-3" /> Weight (kg)
                            </label>
                            <form.Field name={`patientVisits[${index}].weight`}>
                              {(sub: unknown) => {
                                const subField = asValueField<string>(sub);

                                return (
                                  <Input
                                    placeholder="kg"
                                    className="h-8 text-sm border-cyan-200"
                                    value={subField.state.value || ""}
                                    onChange={(e) =>
                                      subField.handleChange(e.target.value)
                                    }
                                  />
                                );
                              }}
                            </form.Field>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-cyan-600 font-bold uppercase">
                              BMI
                            </label>
                            <form.Field name={`patientVisits[${index}].bmi`}>
                              {(sub: unknown) => {
                                const subField = asValueField<string>(sub);

                                return (
                                  <Input
                                    placeholder="Calc"
                                    className="h-8 text-sm border-cyan-200"
                                    value={subField.state.value || ""}
                                    onChange={(e) =>
                                      subField.handleChange(e.target.value)
                                    }
                                  />
                                );
                              }}
                            </form.Field>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-cyan-600 font-bold uppercase">
                              Wound Status
                            </label>
                            <form.Field
                              name={`patientVisits[${index}].woundStatus`}
                            >
                              {(sub: unknown) => {
                                const subField = asValueField<string>(sub);

                                return (
                                  <select
                                    className="flex h-8 w-full rounded-md border border-cyan-200 bg-background px-3 text-sm"
                                    value={subField.state.value || "Clean"}
                                    onChange={(e) =>
                                      subField.handleChange(e.target.value)
                                    }
                                  >
                                    <option value="Clean">Clean</option>
                                    <option value="Inflamed">Inflamed</option>
                                    <option value="Infected">Infected</option>
                                    <option value="Dehiscence">
                                      Dehiscence
                                    </option>
                                    <option value="Healing">Healing</option>
                                    <option value="Healed">Healed</option>
                                  </select>
                                );
                              }}
                            </form.Field>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">
                            Clinical Findings
                          </label>
                          <form.Field
                            name={`patientVisits[${index}].clinicalFindings`}
                          >
                            {(sub: unknown) => {
                              const subField = asValueField<string>(sub);

                              return (
                                <Textarea
                                  rows={4}
                                  className="resize-none"
                                  placeholder="Physical exam notes..."
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
                            New Prescriptions
                          </label>
                          <form.Field
                            name={`patientVisits[${index}].newPrescriptions`}
                          >
                            {(sub: unknown) => {
                              const subField = asValueField<string>(sub);

                              return (
                                <Textarea
                                  rows={3}
                                  className="resize-none"
                                  placeholder="Medications prescribed..."
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
                            Investigations Ordered
                          </label>
                          <form.Field
                            name={`patientVisits[${index}].investigationsOrdered`}
                          >
                            {(sub: unknown) => {
                              const subField = asValueField<string>(sub);

                              return (
                                <Textarea
                                  rows={3}
                                  className="resize-none"
                                  placeholder="Labs, imaging, etc..."
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
                            Recommendations
                          </label>
                          <form.Field
                            name={`patientVisits[${index}].recommendations`}
                          >
                            {(sub: unknown) => {
                              const subField = asValueField<string>(sub);

                              return (
                                <Textarea
                                  rows={3}
                                  className="resize-none"
                                  placeholder="Advice, follow-up..."
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
                            Next Appointment Date
                          </label>
                          <form.Field
                            name={`patientVisits[${index}].nextAppointmentDate`}
                          >
                            {(sub: unknown) => {
                              const subField = asValueField<DateValue>(sub);

                              return (
                                <Input
                                  type="date"
                                  value={(subField.state.value as string) || ""}
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
                  <CalendarDays className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm">No visits recorded yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      }}
    </form.Field>
  );
}

export default VisitsForm;

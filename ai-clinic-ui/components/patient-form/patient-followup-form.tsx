"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Plus, CalendarClock, ClipboardCheck } from "lucide-react";
import { withForm, medicalRecordFormOpts } from "@/lib/tansack-form";
import { PatientFollowup } from "@/drizzle/schemas/patient_follow-up";

type SimpleFieldApi<T> = {
  state: { value: T; meta?: { errors: unknown[] } };
  handleChange: (value: T) => void;
  handleBlur?: () => void;
};

const PatientFollowupForm = withForm({
  ...medicalRecordFormOpts,
  render: function Render({ form }) {
    return (
      <div className="flex flex-col h-full max-h-[85vh]">
        <div className="flex items-center justify-between mb-4 px-1">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              Follow-up Visits
            </h2>
            <p className="text-xs text-muted-foreground">
              Track post-operative care and future appointments
            </p>
          </div>
        </div>

        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-6 pb-10 px-1">
            <FollowupsArray form={form} />
          </div>
        </ScrollArea>
      </div>
    );
  },
});

export default PatientFollowupForm;

function FollowupsArray({
  form,
}: {
  form: Parameters<typeof PatientFollowupForm>[0]["form"];
}) {
  return (
    <form.Field name="patientFollowups" mode="array">
      {(fieldValue) => {
        const field = fieldValue as {
          state: { value?: PatientFollowup[] };
          pushValue: (value: PatientFollowup) => void;
          removeValue: (index: number) => void;
        };
        return (
          <Card className="border-indigo-100 dark:border-indigo-900/30">
            <CardHeader className="flex flex-row items-center justify-between py-4 bg-indigo-50/50 dark:bg-indigo-900/10">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-indigo-600" />
                <CardTitle className="text-base">Visit Log</CardTitle>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-indigo-200 hover:bg-indigo-100 hover:text-indigo-700 dark:border-indigo-800 dark:hover:bg-indigo-900"
                onClick={() =>
                  field.pushValue({
                    callDate: new Date(),
                    scheduledVisitDate: new Date(),
                    medicationAdherence: "",
                    dietNotes: "",
                    activityLevel: "",
                    bowelMovement: "Normal Stool",
                    urineFrequency: "",
                    symptoms: "",
                    spirometer: "",
                    id: "",
                    patientId: "",
                  })
                }
              >
                <Plus className="w-4 h-4 mr-1" /> Add Visit
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {(field.state.value || []).map(
                (_: PatientFollowup, index: number) => (
                  <div
                    key={index}
                    className="flex flex-col gap-3 p-4 border rounded-xl bg-card shadow-sm relative group transition-all hover:shadow-md"
                  >
                    <div className="absolute top-3 right-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                        onClick={() => field.removeValue(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:pr-10">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Call Date
                        </label>
                        <form.Field
                          name={`patientFollowups[${index}].callDate`}
                        >
                          {(subValue) => {
                            const sub = subValue as SimpleFieldApi<Date>;
                            return (
                              <Input
                                type="date"
                                className="font-medium"
                                value={
                                  sub.state.value
                                    ? new Date(sub.state.value)
                                        .toISOString()
                                        .split("T")[0]
                                    : ""
                                }
                                onChange={(e) =>
                                  sub.handleChange(new Date(e.target.value))
                                }
                              />
                            );
                          }}
                        </form.Field>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Scheduled Visit
                        </label>
                        <form.Field
                          name={`patientFollowups[${index}].scheduledVisitDate`}
                        >
                          {(subValue) => {
                            const sub = subValue as SimpleFieldApi<Date>;
                            return (
                              <Input
                                type="date"
                                className="font-medium"
                                value={
                                  sub.state.value
                                    ? new Date(sub.state.value)
                                        .toISOString()
                                        .split("T")[0]
                                    : ""
                                }
                                onChange={(e) =>
                                  sub.handleChange(new Date(e.target.value))
                                }
                              />
                            );
                          }}
                        </form.Field>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Bowel Movement
                        </label>
                        <form.Field
                          name={`patientFollowups[${index}].bowelMovement`}
                        >
                          {(subValue) => {
                            const sub = subValue as SimpleFieldApi<string>;
                            return (
                              <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ring-offset-background"
                                value={sub.state.value || "Normal Stool"}
                                onChange={(e) =>
                                  sub.handleChange(e.target.value)
                                }
                              >
                                <option value="Normal Stool">
                                  Normal Stool
                                </option>
                                <option value="Flatus Only">Flatus Only</option>
                                <option value="Constipated">Constipated</option>
                                <option value="Diarrhea">Diarrhea</option>
                                <option value="No Movement">No Movement</option>
                              </select>
                            );
                          }}
                        </form.Field>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <ClipboardCheck className="w-3 h-3" /> Medication
                          Adherence
                        </label>
                        <form.Field
                          name={`patientFollowups[${index}].medicationAdherence`}
                        >
                          {(subValue) => {
                            const sub = subValue as SimpleFieldApi<string>;
                            return (
                              <Textarea
                                rows={3}
                                placeholder="Meds taken, missed doses, notes..."
                                className="resize-y bg-muted/5 focus:bg-background transition-colors"
                                value={sub.state.value || ""}
                                onChange={(e) =>
                                  sub.handleChange(e.target.value)
                                }
                              />
                            );
                          }}
                        </form.Field>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Symptoms
                        </label>
                        <form.Field
                          name={`patientFollowups[${index}].symptoms`}
                        >
                          {(subValue) => {
                            const sub = subValue as SimpleFieldApi<string>;
                            return (
                              <Textarea
                                rows={3}
                                placeholder="Reported symptoms..."
                                className="resize-y bg-muted/5 focus:bg-background transition-colors"
                                value={sub.state.value || ""}
                                onChange={(e) =>
                                  sub.handleChange(e.target.value)
                                }
                              />
                            );
                          }}
                        </form.Field>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Diet Notes
                        </label>
                        <form.Field
                          name={`patientFollowups[${index}].dietNotes`}
                        >
                          {(subValue) => {
                            const sub = subValue as SimpleFieldApi<string>;
                            return (
                              <Input
                                placeholder="Dietary notes"
                                value={sub.state.value || ""}
                                onChange={(e) =>
                                  sub.handleChange(e.target.value)
                                }
                              />
                            );
                          }}
                        </form.Field>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Activity Level
                        </label>
                        <form.Field
                          name={`patientFollowups[${index}].activityLevel`}
                        >
                          {(subValue) => {
                            const sub = subValue as SimpleFieldApi<string>;
                            return (
                              <Input
                                placeholder="Activity level"
                                value={sub.state.value || ""}
                                onChange={(e) =>
                                  sub.handleChange(e.target.value)
                                }
                              />
                            );
                          }}
                        </form.Field>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Urine Frequency
                        </label>
                        <form.Field
                          name={`patientFollowups[${index}].urineFrequency`}
                        >
                          {(subValue) => {
                            const sub = subValue as SimpleFieldApi<string>;
                            return (
                              <Input
                                placeholder="e.g., Normal, Frequent"
                                value={sub.state.value || ""}
                                onChange={(e) =>
                                  sub.handleChange(e.target.value)
                                }
                              />
                            );
                          }}
                        </form.Field>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Spirometer
                        </label>
                        <form.Field
                          name={`patientFollowups[${index}].spirometer`}
                        >
                          {(subValue) => {
                            const sub = subValue as SimpleFieldApi<string>;
                            return (
                              <Input
                                placeholder="Spirometer usage"
                                value={sub.state.value || ""}
                                onChange={(e) =>
                                  sub.handleChange(e.target.value)
                                }
                              />
                            );
                          }}
                        </form.Field>
                      </div>
                    </div>
                  </div>
                ),
              )}

              {(field.state.value || []).length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/5">
                  <CalendarClock className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm">No follow-up visits recorded.</p>
                  <Button
                    variant="link"
                    className="text-indigo-500"
                    onClick={() =>
                      field.pushValue({
                        callDate: new Date(),
                        scheduledVisitDate: new Date(),
                        medicationAdherence: "",
                        dietNotes: "",
                        activityLevel: "",
                        bowelMovement: "Normal Stool",
                        urineFrequency: "",
                        symptoms: "",
                        spirometer: "",
                        id: "",
                        patientId: "",
                      })
                    }
                  >
                    Schedule First Visit
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      }}
    </form.Field>
  );
}

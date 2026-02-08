"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Trash2,
  Plus,
  Image as ImageIcon,
  Scan,
  FileText,
  Film,
} from "lucide-react";
import { withForm, medicalRecordFormOpts } from "@/lib/tansack-form";

type DateValue = Date | string | null | undefined;

type ImagingReportValue = string | Record<string, unknown> | null | undefined;

interface PatientImagingForm {
  studyName?: string | null;
  modality?: string | null;
  category?: string | null;
  studyDate?: DateValue;
  report?: ImagingReportValue;
  impression?: string | null;
  imageUrl?: string | null;
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

const asArrayField = (field: unknown): ArrayFieldApi<PatientImagingForm> =>
  field as ArrayFieldApi<PatientImagingForm>;

const asValueField = <TValue,>(field: unknown): ValueFieldApi<TValue> =>
  field as ValueFieldApi<TValue>;

const ImagingForm = withForm({
  ...medicalRecordFormOpts,
  render: function Render({ form }) {
    return (
      <div className="flex flex-col h-full max-h-[85vh]">
        <div className="flex items-center justify-between mb-4 px-1">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              Imaging & Radiology
            </h2>
            <p className="text-xs text-muted-foreground">
              Upload or transcribe findings from X-Rays, CTs, Ultrasounds, etc.
            </p>
          </div>
        </div>

        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-6 pb-10 px-1">
            <ImagingArray form={form} />
          </div>
        </ScrollArea>
      </div>
    );
  },
});

function ImagingArray({
  form,
}: {
  form: Parameters<typeof ImagingForm>[0]["form"];
}) {
  return (
    <form.Field name="patientImaging" mode="array">
      {(field: unknown) => {
        const arrayField = asArrayField(field);

        return (
          <Card className="border-violet-100 dark:border-violet-900/30">
            <CardHeader className="flex flex-row items-center justify-between py-4 bg-violet-50/50 dark:bg-violet-900/10">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-violet-600" />
                <CardTitle className="text-base">Radiology Reports</CardTitle>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="hover:bg-violet-100 hover:text-violet-700 dark:hover:bg-violet-900"
                onClick={() =>
                  arrayField.pushValue({
                    studyName: "",
                    modality: "X-Ray",
                    category: "Preoperative",
                    studyDate: "",
                    report: "",
                    impression: "",
                    imageUrl: "",
                  })
                }
              >
                <Plus className="w-4 h-4 mr-1" /> Add Study
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-6">
              {(arrayField.state.value || []).map(
                (_: PatientImagingForm, index: number) => (
                  <div
                    key={index}
                    className="relative p-4 border rounded-xl bg-card shadow-sm group"
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

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-3 space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">
                          Modality
                        </label>
                        <div className="relative">
                          <Scan className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <form.Field
                            name={`patientImaging[${index}].modality`}
                          >
                            {(sub: unknown) => {
                              const subField = asValueField<string>(sub);

                              return (
                                <select
                                  className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                                  value={subField.state.value || "X-Ray"}
                                  onChange={(e) =>
                                    subField.handleChange(e.target.value)
                                  }
                                >
                                  <option value="X-Ray">X-Ray</option>
                                  <option value="Ultrasound">Ultrasound</option>
                                  <option value="Echocardiogram">
                                    Echocardiogram
                                  </option>
                                  <option value="CT Scan">CT Scan</option>
                                  <option value="MRI">MRI</option>
                                  <option value="Endoscopy">Endoscopy</option>
                                  <option value="Other">Other</option>
                                </select>
                              );
                            }}
                          </form.Field>
                        </div>
                      </div>

                      <div className="md:col-span-3 space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">
                          Category
                        </label>
                        <form.Field name={`patientImaging[${index}].category`}>
                          {(sub: unknown) => {
                            const subField = asValueField<string>(sub);

                            return (
                              <select
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                                value={subField.state.value || "Preoperative"}
                                onChange={(e) =>
                                  subField.handleChange(e.target.value)
                                }
                              >
                                <option value="Preoperative">
                                  Preoperative
                                </option>
                                <option value="Postoperative">
                                  Postoperative
                                </option>
                                <option value="Non-routine">Non-routine</option>
                              </select>
                            );
                          }}
                        </form.Field>
                      </div>

                      <div className="md:col-span-3 space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">
                          Study Date
                        </label>
                        <form.Field name={`patientImaging[${index}].studyDate`}>
                          {(sub: unknown) => {
                            const subField = asValueField<DateValue>(sub);

                            return (
                              <Input
                                type="date"
                                className="h-9"
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

                      <div className="md:col-span-3 space-y-1.5 pr-8">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">
                          Study Name
                        </label>
                        <form.Field name={`patientImaging[${index}].studyName`}>
                          {(sub: unknown) => {
                            const subField = asValueField<string>(sub);

                            return (
                              <Input
                                placeholder="e.g. Abdominal Pelvic U/S"
                                className="h-9 font-medium"
                                value={subField.state.value || ""}
                                onChange={(e) =>
                                  subField.handleChange(e.target.value)
                                }
                              />
                            );
                          }}
                        </form.Field>
                      </div>

                      <div className="md:col-span-8 space-y-1.5">
                        <label className="text-xs font-semibold uppercase flex items-center gap-2 text-muted-foreground">
                          <FileText className="w-3 h-3" /> Full Report
                        </label>
                        <form.Field name={`patientImaging[${index}].report`}>
                          {(sub: unknown) => {
                            const subField =
                              asValueField<ImagingReportValue>(sub);

                            return (
                              <Textarea
                                rows={8}
                                placeholder="Paste the full report or structured JSON..."
                                className="resize-y bg-muted/5 leading-relaxed font-mono text-xs"
                                value={
                                  typeof subField.state.value === "string"
                                    ? subField.state.value
                                    : subField.state.value
                                      ? JSON.stringify(
                                          subField.state.value,
                                          null,
                                          2,
                                        )
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

                      <div className="md:col-span-4 space-y-1.5">
                        <label className="text-xs font-semibold uppercase text-violet-600">
                          Impression
                        </label>
                        <form.Field
                          name={`patientImaging[${index}].impression`}
                        >
                          {(sub: unknown) => {
                            const subField = asValueField<string>(sub);

                            return (
                              <Textarea
                                rows={4}
                                placeholder="Summary diagnosis"
                                className="resize-y border-violet-200 focus-visible:ring-violet-500 bg-violet-50/30"
                                value={subField.state.value || ""}
                                onChange={(e) =>
                                  subField.handleChange(e.target.value)
                                }
                              />
                            );
                          }}
                        </form.Field>
                      </div>

                      <div className="md:col-span-8 space-y-1.5">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">
                          Image URL
                        </label>
                        <form.Field name={`patientImaging[${index}].imageUrl`}>
                          {(sub: unknown) => {
                            const subField = asValueField<string>(sub);

                            return (
                              <Input
                                placeholder="https://..."
                                className="h-9"
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
                ),
              )}

              {(arrayField.state.value || []).length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/5 opacity-70">
                  <ImageIcon className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm">No imaging studies recorded.</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      }}
    </form.Field>
  );
}

export default ImagingForm;

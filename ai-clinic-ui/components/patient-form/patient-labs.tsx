"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  Plus,
  FlaskConical,
  Activity,
  FileDigit,
  Calendar,
} from "lucide-react";
import { withForm, medicalRecordFormOpts } from "@/lib/tansack-form";

type DateValue = Date | string | null | undefined;

interface LabResultForm {
  value?: string | null;
  unit?: string | null;
  reference_range?: {
    min?: string | null;
    max?: string | null;
  };
}

interface PatientLabForm {
  testName?: string | null;
  category?: string | null;
  status?: string | null;
  labDate?: DateValue;
  notes?: string | null;
  results?: LabResultForm | null;
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

const asArrayField = (field: unknown): ArrayFieldApi<PatientLabForm> =>
  field as ArrayFieldApi<PatientLabForm>;

const asValueField = <TValue,>(field: unknown): ValueFieldApi<TValue> =>
  field as ValueFieldApi<TValue>;

const LabsForm = withForm({
  ...medicalRecordFormOpts,
  render: function Render({ form }) {
    return (
      <div className="flex flex-col h-full max-h-[85vh]">
        <div className="flex items-center justify-between mb-4 px-1">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              Laboratory Results
            </h2>
            <p className="text-xs text-muted-foreground">
              Unified lab record sorted by clinical timing
            </p>
          </div>
        </div>

        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-8 pb-10 px-1">
            <form.Field name="patientLabs" mode="array">
              {(field: unknown) => {
                const arrayField = asArrayField(field);

                return (
                  <Card className="border-indigo-100 dark:border-indigo-900/30">
                    <CardHeader className="flex flex-row items-center justify-between py-4 bg-indigo-50/50 dark:bg-indigo-900/10">
                      <div className="flex items-center gap-2">
                        <FlaskConical className="w-5 h-5 text-indigo-600" />
                        <CardTitle className="text-base">Lab Results</CardTitle>
                        <Badge variant="secondary" className="ml-2 bg-white/50">
                          {(arrayField.state.value || []).length}
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="hover:bg-indigo-100 hover:text-indigo-700"
                        onClick={() =>
                          arrayField.pushValue({
                            testName: "",
                            category: "Non-routine",
                            status: "Final",
                            labDate: "",
                            notes: "",
                            results: {
                              value: "",
                              unit: "",
                              reference_range: { min: "", max: "" },
                            },
                          })
                        }
                      >
                        <Plus className="w-4 h-4 mr-1" /> Add Result
                      </Button>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      {(arrayField.state.value || []).map(
                        (_: PatientLabForm, index: number) => {
                          const category =
                            arrayField.state.value?.[index]?.category ||
                            "Non-routine";
                          const categoryStyles =
                            category === "Preoperative"
                              ? "border-blue-200 bg-blue-50/30"
                              : category === "Postoperative"
                                ? "border-emerald-200 bg-emerald-50/30"
                                : "border-amber-200 bg-amber-50/30";
                          const badgeStyles =
                            category === "Preoperative"
                              ? "bg-blue-100 text-blue-700"
                              : category === "Postoperative"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700";

                          return (
                            <div
                              key={index}
                              className={`relative p-4 border rounded-lg hover:shadow-sm transition-all group ${categoryStyles}`}
                            >
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-50 z-10"
                                onClick={() => arrayField.removeValue(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>

                              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-5 space-y-3">
                                  <div className="flex gap-2">
                                    <div className="w-2/3 space-y-1">
                                      <label className="text-[10px] uppercase font-bold text-muted-foreground">
                                        Test Name
                                      </label>
                                      <form.Field
                                        name={`patientLabs[${index}].testName`}
                                      >
                                        {(sub: unknown) => {
                                          const subField =
                                            asValueField<string>(sub);

                                          return (
                                            <Input
                                              placeholder="e.g. Haemoglobin"
                                              className="font-medium"
                                              value={subField.state.value || ""}
                                              onChange={(e) =>
                                                subField.handleChange(
                                                  e.target.value,
                                                )
                                              }
                                            />
                                          );
                                        }}
                                      </form.Field>
                                    </div>
                                    <div className="w-1/3 space-y-1">
                                      <label className="text-[10px] uppercase font-bold text-muted-foreground">
                                        Type
                                      </label>
                                      <form.Field
                                        name={`patientLabs[${index}].category`}
                                      >
                                        {(sub: unknown) => {
                                          const subField =
                                            asValueField<string>(sub);

                                          return (
                                            <select
                                              className="flex h-10 w-full rounded-md border border-input bg-background px-2 text-xs"
                                              value={
                                                subField.state.value ||
                                                "Non-routine"
                                              }
                                              onChange={(e) =>
                                                subField.handleChange(
                                                  e.target.value,
                                                )
                                              }
                                            >
                                              <option value="Preoperative">
                                                Preoperative
                                              </option>
                                              <option value="Postoperative">
                                                Postoperative
                                              </option>
                                              <option value="Non-routine">
                                                Non-routine
                                              </option>
                                            </select>
                                          );
                                        }}
                                      </form.Field>
                                      <Badge
                                        className={`mt-1 w-full justify-center text-[10px] ${badgeStyles}`}
                                      >
                                        {category}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="space-y-1 relative">
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                      <Calendar className="w-3 h-3" /> Lab Date
                                    </label>
                                    <form.Field
                                      name={`patientLabs[${index}].labDate`}
                                    >
                                      {(sub: unknown) => {
                                        const subField =
                                          asValueField<DateValue>(sub);

                                        return (
                                          <Input
                                            type="date"
                                            className="text-sm"
                                            value={
                                              subField.state.value
                                                ? new Date(subField.state.value)
                                                    .toISOString()
                                                    .split("T")[0]
                                                : ""
                                            }
                                            onChange={(e) =>
                                              subField.handleChange(
                                                e.target.value,
                                              )
                                            }
                                          />
                                        );
                                      }}
                                    </form.Field>
                                  </div>
                                </div>

                                <div className="md:col-span-7 grid grid-cols-2 gap-3">
                                  <div className="col-span-2 grid grid-cols-3 gap-2">
                                    <div className="col-span-2 space-y-1">
                                      <label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                        <Activity className="w-3 h-3" /> Result
                                      </label>
                                      <form.Field
                                        name={`patientLabs[${index}].results.value`}
                                      >
                                        {(sub: unknown) => {
                                          const subField =
                                            asValueField<string>(sub);

                                          return (
                                            <Input
                                              placeholder="Value"
                                              value={subField.state.value || ""}
                                              onChange={(e) =>
                                                subField.handleChange(
                                                  e.target.value,
                                                )
                                              }
                                            />
                                          );
                                        }}
                                      </form.Field>
                                    </div>
                                    <div className="col-span-1 space-y-1">
                                      <label className="text-[10px] uppercase font-bold text-muted-foreground">
                                        Unit
                                      </label>
                                      <form.Field
                                        name={`patientLabs[${index}].results.unit`}
                                      >
                                        {(sub: unknown) => {
                                          const subField =
                                            asValueField<string>(sub);

                                          return (
                                            <Input
                                              placeholder="Unit"
                                              value={subField.state.value || ""}
                                              onChange={(e) =>
                                                subField.handleChange(
                                                  e.target.value,
                                                )
                                              }
                                            />
                                          );
                                        }}
                                      </form.Field>
                                    </div>
                                  </div>

                                  <div className="col-span-2 grid grid-cols-2 gap-2 bg-muted/20 p-2 rounded-md border border-dashed">
                                    <div className="space-y-1">
                                      <label className="text-[10px] uppercase font-bold text-muted-foreground">
                                        Ref Min
                                      </label>
                                      <form.Field
                                        name={`patientLabs[${index}].results.reference_range.min`}
                                      >
                                        {(sub: unknown) => {
                                          const subField =
                                            asValueField<string>(sub);

                                          return (
                                            <Input
                                              placeholder="Min"
                                              className="h-8 text-xs bg-background"
                                              value={subField.state.value || ""}
                                              onChange={(e) =>
                                                subField.handleChange(
                                                  e.target.value,
                                                )
                                              }
                                            />
                                          );
                                        }}
                                      </form.Field>
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] uppercase font-bold text-muted-foreground">
                                        Ref Max
                                      </label>
                                      <form.Field
                                        name={`patientLabs[${index}].results.reference_range.max`}
                                      >
                                        {(sub: unknown) => {
                                          const subField =
                                            asValueField<string>(sub);

                                          return (
                                            <Input
                                              placeholder="Max"
                                              className="h-8 text-xs bg-background"
                                              value={subField.state.value || ""}
                                              onChange={(e) =>
                                                subField.handleChange(
                                                  e.target.value,
                                                )
                                              }
                                            />
                                          );
                                        }}
                                      </form.Field>
                                    </div>
                                  </div>

                                  <div className="col-span-2 grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <label className="text-[10px] uppercase font-bold text-muted-foreground">
                                        Status
                                      </label>
                                      <form.Field
                                        name={`patientLabs[${index}].status`}
                                      >
                                        {(sub: unknown) => {
                                          const subField =
                                            asValueField<string>(sub);

                                          return (
                                            <select
                                              className="flex h-10 w-full rounded-md border border-input bg-background px-2 text-xs"
                                              value={
                                                subField.state.value || "Final"
                                              }
                                              onChange={(e) =>
                                                subField.handleChange(
                                                  e.target.value,
                                                )
                                              }
                                            >
                                              <option value="Pending">
                                                Pending
                                              </option>
                                              <option value="Final">
                                                Final
                                              </option>
                                              <option value="Cancelled">
                                                Cancelled
                                              </option>
                                            </select>
                                          );
                                        }}
                                      </form.Field>
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] uppercase font-bold text-muted-foreground">
                                        Notes
                                      </label>
                                      <form.Field
                                        name={`patientLabs[${index}].notes`}
                                      >
                                        {(sub: unknown) => {
                                          const subField =
                                            asValueField<string>(sub);

                                          return (
                                            <Input
                                              placeholder="e.g. Critical High"
                                              className="text-xs"
                                              value={subField.state.value || ""}
                                              onChange={(e) =>
                                                subField.handleChange(
                                                  e.target.value,
                                                )
                                              }
                                            />
                                          );
                                        }}
                                      </form.Field>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        },
                      )}

                      {(arrayField.state.value || []).length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground border-2 border-dashed rounded-lg opacity-60">
                          <FileDigit className="w-8 h-8 mb-2" />
                          <p className="text-sm">No lab results yet.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              }}
            </form.Field>
          </div>
        </ScrollArea>
      </div>
    );
  },
});

export default LabsForm;

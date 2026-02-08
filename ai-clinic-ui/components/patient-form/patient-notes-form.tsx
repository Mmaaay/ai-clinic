"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Plus, StickyNote, PenTool, Tag, Calendar } from "lucide-react";
import { withForm, medicalRecordFormOpts } from "@/lib/tansack-form";

type DateValue = Date | string | null | undefined;

interface PatientNoteForm {
  title?: string | null;
  category?: string | null;
  note_date?: DateValue;
  content?: string | null;
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

const asArrayField = (field: unknown): ArrayFieldApi<PatientNoteForm> =>
  field as ArrayFieldApi<PatientNoteForm>;

const asValueField = <TValue,>(field: unknown): ValueFieldApi<TValue> =>
  field as ValueFieldApi<TValue>;

const NotesForm = withForm({
  ...medicalRecordFormOpts,
  render: function Render({ form }) {
    return (
      <div className="flex flex-col h-full max-h-[85vh]">
        <div className="flex items-center justify-between mb-4 px-1">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              Clinical Notes
            </h2>
            <p className="text-xs text-muted-foreground">
              General observations, administrative memos, or multidisciplinary
              notes.
            </p>
          </div>
        </div>

        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-6 pb-10 px-1">
            <NotesArray form={form} />
          </div>
        </ScrollArea>
      </div>
    );
  },
});

function NotesArray({
  form,
}: {
  form: Parameters<typeof NotesForm>[0]["form"];
}) {
  return (
    <form.Field name="patientNotes" mode="array">
      {(field: unknown) => {
        const arrayField = asArrayField(field);

        return (
          <Card className="border-amber-200 dark:border-amber-900/40">
            <CardHeader className="flex flex-row items-center justify-between py-4 bg-amber-100/40 dark:bg-amber-900/10">
              <div className="flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-amber-600" />
                <CardTitle className="text-base">Notepad</CardTitle>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-900 border-amber-200 dark:border-amber-800"
                onClick={() =>
                  arrayField.pushValue({
                    title: "",
                    category: "General",
                    note_date: new Date().toISOString().split("T")[0],
                    content: "",
                  })
                }
              >
                <Plus className="w-4 h-4 mr-1" /> Add Note
              </Button>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {(arrayField.state.value || []).map(
                (_: PatientNoteForm, index: number) => (
                  <div
                    key={index}
                    className="relative flex flex-col gap-3 p-4 border rounded-xl bg-amber-50/30 dark:bg-card shadow-sm hover:shadow-md transition-all group"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 text-muted-foreground/50 hover:text-red-500 hover:bg-red-50"
                      onClick={() => arrayField.removeValue(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>

                    <div className="space-y-3 pr-8">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">
                          Title / Subject
                        </label>
                        <form.Field name={`patientNotes[${index}].title`}>
                          {(sub: unknown) => {
                            const subField = asValueField<string>(sub);

                            return (
                              <Input
                                placeholder="e.g. Preoperative Clearance"
                                className="font-semibold bg-white/50 dark:bg-muted/20"
                                value={subField.state.value || ""}
                                onChange={(e) =>
                                  subField.handleChange(e.target.value)
                                }
                              />
                            );
                          }}
                        </form.Field>
                      </div>

                      <div className="flex gap-2">
                        <div className="w-1/2 space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                            <Tag className="w-3 h-3" /> Category
                          </label>
                          <form.Field name={`patientNotes[${index}].category`}>
                            {(sub: unknown) => {
                              const subField = asValueField<string>(sub);

                              return (
                                <select
                                  className="flex h-9 w-full rounded-md border border-input bg-white/50 dark:bg-muted/20 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                  value={subField.state.value || "General"}
                                  onChange={(e) =>
                                    subField.handleChange(e.target.value)
                                  }
                                >
                                  <option value="General">General</option>
                                  <option value="Clinical">Clinical</option>
                                  <option value="Nursing">Nursing</option>
                                  <option value="Dietary">Dietary</option>
                                  <option value="Administrative">
                                    Administrative
                                  </option>
                                  <option value="Psychological">
                                    Psychological
                                  </option>
                                </select>
                              );
                            }}
                          </form.Field>
                        </div>
                        <div className="w-1/2 space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Date
                          </label>
                          <form.Field name={`patientNotes[${index}].createdAt`}>
                            {(sub: unknown) => {
                              const subField = asValueField<DateValue>(sub);

                              return (
                                <Input
                                  type="date"
                                  className="h-9 bg-white/50 dark:bg-muted/20"
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

                    <div className="flex-1 space-y-1 mt-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                        <PenTool className="w-3 h-3" /> Content
                      </label>
                      <form.Field name={`patientNotes[${index}].content`}>
                        {(sub: unknown) => {
                          const subField = asValueField<string>(sub);

                          return (
                            <Textarea
                              placeholder="Write note content here..."
                              className="h-40 resize-none bg-white/80 dark:bg-muted/10 border-amber-100 dark:border-border focus-visible:ring-amber-500"
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
                ),
              )}

              {(arrayField.state.value || []).length === 0 && (
                <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center py-16 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/5">
                  <StickyNote className="w-12 h-12 mb-3 opacity-20 text-amber-500" />
                  <p className="text-sm">No notes added.</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      }}
    </form.Field>
  );
}

export default NotesForm;

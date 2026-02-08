"use client";

import { updatePatientRecord } from "@/actions/patient-actions/medical-record-actions";
import NotesForm from "@/components/patient-form/patient-notes-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { medicalRecordFormSchema } from "@/drizzle/general-medical-history";
import { PatientNotesRecord } from "@/drizzle/schemas/patient_notes";
import { formatDateLocal } from "@/lib/helpers/format-date-local";
import { getPatientNotesById } from "@/lib/server/get-patient-notes-by-id";
import { medicalRecordFormOpts, useAppForm } from "@/lib/tansack-form";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Clock,
  Filter,
  MessageSquare,
  Pin,
  ShieldCheck,
  Stethoscope,
  StickyNote,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";

// Types from your schema
type NoteRecord = PatientNotesRecord;

const getCategoryStyles = (category: string) => {
  switch (category) {
    case "Administrative":
      return {
        icon: <ShieldCheck className="w-4 h-4" />,
        color: "bg-amber-100 text-amber-700 border-amber-200",
      };
    case "Secondary Procedure":
      return {
        icon: <Stethoscope className="w-4 h-4" />,
        color: "bg-purple-100 text-purple-700 border-purple-200",
      };
    case "Communication":
      return {
        icon: <MessageSquare className="w-4 h-4" />,
        color: "bg-blue-100 text-blue-700 border-blue-200",
      };
    default:
      return {
        icon: <StickyNote className="w-4 h-4" />,
        color: "bg-slate-100 text-slate-700 border-slate-200",
      };
  }
};

export default function PatientNotesSection({ id }: { id: string }) {
  const [dateFilter, setDateFilter] = useState<string>(""); // YYYY-MM-DD string
  const [isEditing, setIsEditing] = useState(false);
  const [, setServerError] = useState<string | null>(null);

  const router = useRouter();

  const { data: notesData, isLoading } = useQuery({
    queryKey: ["patient", "notes", id],
    queryFn: () => getPatientNotesById({ patientId: id }),
    staleTime: 1000 * 60 * 5,
  });

  const notes = useMemo<NoteRecord[]>(() => {
    if (Array.isArray(notesData)) return notesData;
    return [];
  }, [notesData]);

  const form = useAppForm({
    ...medicalRecordFormOpts,
    onSubmit: async ({ value }) => {
      setServerError(null);
      startTransition(async () => {
        try {
          const parsed = medicalRecordFormSchema.safeParse(value);
          if (!parsed.success) {
            setServerError("Please check required fields.");
            return;
          }
          const result = await updatePatientRecord({
            patientId: id,
            data: parsed.data,
          });
          if (!result.success) {
            setServerError("Failed to create patient record.");
            return;
          }
          router.push("/");
        } catch (error) {
          console.error("Error:", error);
          setServerError("An unexpected error occurred");
        }
      });
    },
  });

  useEffect(() => {
    form.setFieldValue("patientNotes", notes);
  }, [notes, form]);

  // --- 1. EXTRACT AVAILABLE DATES ---
  const availableDates = useMemo(() => {
    if (!notes) return [];
    const dates = new Set<string>();

    notes.forEach((note) => {
      if (note.createdAt) {
        try {
          dates.add(formatDateLocal(note.createdAt));
        } catch {
          /* ignore invalid date */
        }
      }
    });

    // Sort Descending (Newest first)
    return Array.from(dates).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime(),
    );
  }, [notes]);

  // --- 2. FILTER & SORT LOGIC ---
  const filteredAndSortedNotes = useMemo(() => {
    let result = notes;

    // A. Apply Filter
    if (dateFilter) {
      result = result.filter((note) => {
        if (!note.createdAt) return false;
        const noteDate = formatDateLocal(note.createdAt);
        return noteDate === dateFilter;
      });
    }

    // B. Apply Sort (Pinned First, then Newest)
    return result.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [notes, dateFilter]);

  if (isLoading)
    return <div className="p-4 animate-pulse">Loading notes...</div>;

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-muted/30 p-3 rounded-xl border border-dashed">
          <div className="flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold tracking-tight">
              Clinical & Admin Notes
            </h2>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                form.setFieldValue("patientNotes", notes);
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={() => form.handleSubmit()}>Save</Button>
          </div>
        </div>
        <NotesForm form={form} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* HEADER WITH FILTER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-muted/30 p-3 rounded-xl border border-dashed gap-3">
        <div className="flex items-center gap-2">
          <StickyNote className="w-5 h-5 text-slate-600" />
          <h2 className="text-lg font-semibold tracking-tight">
            Clinical & Admin Notes
          </h2>
        </div>

        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
          Edit
        </Button>

        {/* SMART FILTER DROPDOWN */}
        {availableDates.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto relative">
            <div className="relative w-full sm:w-auto">
              <select
                className="h-9 w-full sm:w-48 text-xs bg-background border border-input rounded-md pl-3 pr-8 focus:ring-1 focus:ring-ring appearance-none"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="">All Notes</option>
                <optgroup label="Filter by Date">
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
              <Filter className="absolute right-2.5 top-2.5 w-4 h-4 text-muted-foreground opacity-50 pointer-events-none" />
            </div>

            {dateFilter && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground"
                onClick={() => setDateFilter("")}
                title="Clear filter"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* RENDER NOTES LIST */}
      {notes.length === 0 ? (
        <Card className="border-dashed py-12 text-center text-muted-foreground">
          <StickyNote className="w-12 h-12 mx-auto mb-2 opacity-20" />
          <p>No notes or communications logged</p>
        </Card>
      ) : filteredAndSortedNotes.length > 0 ? (
        <div className="grid grid-cols-1 gap-3">
          {filteredAndSortedNotes.map((note) => {
            const style = getCategoryStyles(note.category!);
            return (
              <Card
                key={note.id}
                className={`relative transition-all hover:shadow-md ${
                  note.isPinned
                    ? "border-l-4 border-l-amber-500 bg-amber-50/20"
                    : "border-l-4 border-l-slate-400"
                }`}
              >
                {note.isPinned && (
                  <div className="absolute top-3 right-3" title="Pinned Note">
                    <Pin className="w-4 h-4 text-amber-600 fill-amber-600" />
                  </div>
                )}

                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="outline"
                      className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style.color}`}
                    >
                      {style.icon}
                      {note.category}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(note.createdAt), "MMM d, yyyy • HH:mm")}
                    </span>
                  </div>
                  <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {note.title || "Untitled Note"}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-4 pt-0">
                  <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* EMPTY STATE WHEN FILTERING RETURNS NOTHING */
        <div className="text-center p-8 border border-dashed rounded-lg bg-muted/10">
          <p className="text-sm text-muted-foreground italic">
            No notes found for {new Date(dateFilter).toLocaleDateString()}.
          </p>
          <Button
            variant="link"
            size="sm"
            onClick={() => setDateFilter("")}
            className="mt-2"
          >
            Clear filter to see all notes
          </Button>
        </div>
      )}
    </div>
  );
}

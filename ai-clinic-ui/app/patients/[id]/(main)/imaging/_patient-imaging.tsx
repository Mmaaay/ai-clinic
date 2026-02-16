"use client";

import { updatePatientRecord } from "@/actions/patient-actions/medical-record-actions";
import ImagingForm from "@/components/patient-form/patient-imaging-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { medicalRecordFormSchema } from "@/drizzle/general-medical-history";
import { PatientImagingRecord } from "@/drizzle/schemas/patient_images";
import { formatDateLocal } from "@/lib/helpers/format-date-local";
import { getPatientImagingById } from "@/lib/server/patient-imaging-by-id";
import { medicalRecordFormOpts, useAppForm } from "@/lib/tansack-form";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Calendar,
  ChevronDown,
  FileText,
  Filter,
  Image as ImageIcon,
  Search,
  X,
} from "lucide-react";
import { startTransition, useEffect, useMemo, useState } from "react";

// Helper to get icons based on modality
const getModalityIcon = (modality: string | null) => {
  switch (modality) {
    case "X-Ray":
      return <Activity className="w-4 h-4" />;
    case "CT Scan":
    case "MRI":
      return <Search className="w-4 h-4" />;
    case "Ultrasound":
      return <Activity className="w-4 h-4" />;
    default:
      return <ImageIcon className="w-4 h-4" />;
  }
};

const formatKeyLabel = (key: string) => {
  const withSpaces = key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ");
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
};

const formatScalar = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (Array.isArray(value)) {
    return value.map(formatScalar).filter(Boolean).join(", ");
  }
  return JSON.stringify(value, null, 2);
};

const formatReportValue = (value: unknown): string => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return "";
    return entries
      .map(([key, val]) =>
        `${formatKeyLabel(key)}: ${formatScalar(val)}`.trim(),
      )
      .filter(Boolean)
      .join("\n");
  }
  return formatScalar(value);
};

const formatReport = (report: unknown): string => {
  if (report === null || report === undefined) return "";
  if (typeof report === "string") {
    const trimmed = report.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        return formatReportValue(JSON.parse(trimmed));
      } catch {
        return report;
      }
    }

    const start = report.indexOf("{");
    const end = report.lastIndexOf("}");
    if (start !== -1 && end > start) {
      const jsonText = report.slice(start, end + 1);
      try {
        const parsed = JSON.parse(jsonText);
        const before = report.slice(0, start).trim();
        const after = report.slice(end + 1).trim();
        return [before, formatReportValue(parsed), after]
          .filter(Boolean)
          .join("\n");
      } catch {
        return report;
      }
    }

    return report;
  }

  return formatReportValue(report);
};

export default function PatientImagingSection({ id }: { id: string }) {
  const [dateFilter, setDateFilter] = useState<string>(""); // YYYY-MM-DD string
  const [isEditing, setIsEditing] = useState(false);
  const [, setServerError] = useState<string | null>(null);

  const { data: imagingData, isLoading } = useQuery({
    queryKey: ["patient", "imaging", id],
    queryFn: () => getPatientImagingById({ patientId: id }),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const [openGroupIndex, setOpenGroupIndex] = useState<number | null>(0);

  // Normalize Data
  const records = useMemo<PatientImagingRecord[]>(() => {
    if (Array.isArray(imagingData)) return imagingData;
    if (imagingData) return [imagingData];
    return [];
  }, [imagingData]);

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
          setIsEditing(false);
        } catch (error) {
          console.error("Error:", error);
          setServerError("An unexpected error occurred");
        }
      });
    },
  });

  useEffect(() => {
    form.setFieldValue("patientImaging", records);
  }, [records, form]);

  // --- 1. EXTRACT AVAILABLE DATES ---
  const availableDates = useMemo(() => {
    if (!records) return [];
    const dates = new Set<string>();

    records.forEach((study) => {
      if (study.studyDate) {
        try {
          dates.add(formatDateLocal(study.studyDate));
        } catch {
          /* ignore invalid date */
        }
      }
    });

    // Sort Descending (Newest first)
    return Array.from(dates).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime(),
    );
  }, [records]);

  // --- 2. FILTER LOGIC ---
  const filteredRecords = useMemo(() => {
    if (!dateFilter) return records;
    return records.filter((study) => {
      if (!study.studyDate) return false;
      return formatDateLocal(study.studyDate) === dateFilter;
    });
  }, [records, dateFilter]);

  // --- 3. GROUPING LOGIC (Applied to Filtered Data) ---
  const groupByDate = (items: PatientImagingRecord[]) => {
    const grouped: { [key: string]: PatientImagingRecord[] } = {};
    items.forEach((item) => {
      const date = item.studyDate ? new Date(item.studyDate) : new Date();
      const key = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([date, items]) => ({ date, items }));
  };

  const groupedImaging = groupByDate(filteredRecords);

  if (isLoading)
    return <div className="p-4 animate-pulse">Loading imaging records...</div>;

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-muted/30 p-3 rounded-xl border border-dashed">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">
              Imaging & Diagnostics
            </h2>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                form.setFieldValue("patientImaging", records);
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={() => form.handleSubmit()}>Save</Button>
          </div>
        </div>
        <ImagingForm form={form} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* HEADER WITH FILTER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-muted/30 p-3 rounded-xl border border-dashed gap-3">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">
            Imaging & Diagnostics
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
                <option value="">All Studies</option>
                <optgroup label="Filter by Study Date">
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

      {/* RENDER GROUPS */}
      {records.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center py-12 text-muted-foreground">
            <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>No imaging studies found</p>
          </CardContent>
        </Card>
      ) : groupedImaging.length > 0 ? (
        groupedImaging.map((group, groupIdx) => (
          <Collapsible
            key={groupIdx}
            open={openGroupIndex === groupIdx}
            onOpenChange={(open) => setOpenGroupIndex(open ? groupIdx : null)}
          >
            <CollapsibleTrigger className="flex items-center gap-2 p-3 bg-muted/50 hover:bg-muted rounded-lg w-full transition-colors group">
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  openGroupIndex === groupIdx ? "rotate-180" : ""
                }`}
              />
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{group.date}</span>
              <Badge variant="secondary" className="ml-auto bg-background">
                {group.items.length}{" "}
                {group.items.length === 1 ? "Study" : "Studies"}
              </Badge>
            </CollapsibleTrigger>

            <CollapsibleContent className="pt-2 pl-2 sm:pl-4 space-y-4">
              {group.items.map((study, idx) => (
                <Card
                  key={idx}
                  className="overflow-hidden border-l-4 border-l-green-500 shadow-sm"
                >
                  <CardHeader className="bg-muted/20 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getModalityIcon(study.modality)}
                        <CardTitle className="text-sm font-bold uppercase tracking-wide">
                          {study.studyName || "Untitled Study"}
                        </CardTitle>
                      </div>
                      <Badge>{study.category}</Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 text-sm space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                          Modality
                        </label>
                        <p className="font-medium">{study.modality}</p>
                      </div>
                      {study.imageUrl && (
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                            Attachments
                          </label>
                          <a
                            href={study.imageUrl}
                            target="_blank"
                            className="flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            <ImageIcon className="w-3 h-3" /> View Image
                          </a>
                        </div>
                      )}
                    </div>

                    {study.impression && (
                      <div className="bg-green-50/50 dark:bg-green-900/10 p-3 rounded border border-green-100 dark:border-green-900/30">
                        <label className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-wider block mb-1">
                          Clinical Impression
                        </label>
                        <p className="italic text-gray-700 dark:text-gray-300">
                          &quot;{study.impression}&quot;
                        </p>
                      </div>
                    )}

                    {study.report && (
                      <details className="rounded-lg border border-muted/60 bg-muted/20">
                        <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          <FileText className="h-3 w-3" /> Full Report
                          <span className="ml-auto text-[10px] font-normal normal-case text-muted-foreground">
                            Tap to {"expand"}
                          </span>
                        </summary>
                        <div className="border-t border-muted/40 p-3 text-xs text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-mono">
                          {formatReport(study.report)}
                        </div>
                      </details>
                    )}
                  </CardContent>
                </Card>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ))
      ) : (
        /* EMPTY STATE WHEN FILTERING RETURNS NOTHING */
        <div className="text-center p-8 border border-dashed rounded-lg bg-muted/10">
          <p className="text-sm text-muted-foreground italic">
            No imaging studies found for{" "}
            {new Date(dateFilter).toLocaleDateString()}.
          </p>
          <Button
            variant="link"
            size="sm"
            onClick={() => setDateFilter("")}
            className="mt-2"
          >
            Clear filter to see all studies
          </Button>
        </div>
      )}
    </div>
  );
}

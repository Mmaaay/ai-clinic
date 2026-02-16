"use client";

import { updatePatientRecord } from "@/actions/patient-actions/medical-record-actions";
import { BMITrendChart } from "@/components/bmi-chart";
import VisitsForm from "@/components/patient-form/patient-visits-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { medicalRecordFormSchema } from "@/drizzle/general-medical-history";
import { PatientVisitsRecord } from "@/drizzle/schemas/patient_visits";
import { formatDateLocal } from "@/lib/helpers/format-date-local";
import { getPatientVisitsById } from "@/lib/server/get-patient-visits-by-id";
import { medicalRecordFormOpts, useAppForm } from "@/lib/tansack-form";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  ClipboardList,
  Filter,
  Pill,
  Stethoscope,
  Thermometer,
  Weight,
  X,
} from "lucide-react";
import { startTransition, useEffect, useMemo, useState } from "react";

// Use the inferred type from your Drizzle schema
type VisitRecord = PatientVisitsRecord;

const getWoundStatusColor = (status: string) => {
  switch (status) {
    case "Healing":
    case "Healed":
      return "bg-green-100 text-green-700 border-green-200";
    case "Inflamed":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "Infected":
    case "Dehiscence":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

export default function PatientVisitsSection({ id }: { id: string }) {
  const [dateFilter, setDateFilter] = useState<string>(""); // YYYY-MM-DD string
  const [isEditing, setIsEditing] = useState(false);

  const { data: visitData, isLoading } = useQuery({
    queryKey: ["patient", "visits", id],
    queryFn: () => getPatientVisitsById({ patientId: id }),
    staleTime: 1000 * 60 * 5,
  });

  const [openVisitIdx, setOpenVisitIdx] = useState<number | null>(0);
  const [, setServerError] = useState<string | null>(null);

  // Normalize Data
  const visits = useMemo(
    () => (Array.isArray(visitData) ? visitData : []) as VisitRecord[],
    [visitData],
  );

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
            setServerError("Failed to update patient record.");
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
    form.setFieldValue("patientVisits", visits);
  }, [visits, form]);

  // --- 1. EXTRACT AVAILABLE DATES ---
  const availableDates = useMemo(() => {
    if (!visits) return [];
    const dates = new Set<string>();

    visits.forEach((visit) => {
      if (visit.visitDate) {
        try {
          dates.add(formatDateLocal(visit.visitDate));
        } catch {
          /* ignore */
        }
      }
    });

    // Sort Descending (Newest first)
    return Array.from(dates).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime(),
    );
  }, [visits]);

  // --- 2. FILTER LOGIC ---
  const filteredVisits = useMemo(() => {
    if (!dateFilter) return visits;
    return visits.filter((visit) => {
      if (!visit.visitDate) return false;
      return formatDateLocal(visit.visitDate) === dateFilter;
    });
  }, [visits, dateFilter]);

  if (isLoading)
    return <div className="p-4 animate-pulse">Loading clinical visits...</div>;

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-muted/30 p-3 rounded-xl border border-dashed">
          <div className="flex items-center gap-3">
            <Stethoscope className="w-5 h-5 text-rose-600" />
            <h2 className="text-lg font-semibold tracking-tight">
              Clinical Visits & Exams
            </h2>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                form.setFieldValue("patientVisits", visits);
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={() => form.handleSubmit()}>Save</Button>
          </div>
        </div>
        <VisitsForm form={form} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* HEADER WITH FILTER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-muted/30 p-3 rounded-xl border border-dashed gap-3">
        <div className="flex items-center gap-3">
          <Stethoscope className="w-5 h-5 text-rose-600" />
          <h2 className="text-lg font-semibold tracking-tight">
            Clinical Visits & Exams
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
                <option value="">All Visits</option>
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

      {/* BMI TREND VISUALIZATION */}
      {visits.some((v) => v.bmi != null) && (
        <div className="bg-linear-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 p-4 rounded-xl border-2 border-slate-200/50 dark:border-slate-700/50 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Weight className="w-3.5 h-3.5" />
                Body Mass Index Trend
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Hover to expand and see detailed BMI progression
              </p>
            </div>
          </div>
          <BMITrendChart visits={visits} />
        </div>
      )}

      {/* RENDER VISITS LIST */}
      {visits.length === 0 ? (
        <Card className="border-dashed py-12 text-center text-muted-foreground">
          <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-20" />
          <p>No clinical visits recorded yet</p>
        </Card>
      ) : filteredVisits.length > 0 ? (
        filteredVisits.map((visit, idx) => (
          <Collapsible
            key={visit.id || idx}
            open={openVisitIdx === idx}
            onOpenChange={(open) => setOpenVisitIdx(open ? idx : null)}
          >
            <CollapsibleTrigger className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 border rounded-xl w-full hover:shadow-sm transition-all text-left group">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {visit.visitDate
                    ? format(new Date(visit.visitDate), "MMM d, yyyy")
                    : "Unknown Date"}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-semibold">{visit.visitType} Visit</span>
                  {visit.visitType === "Urgent" && (
                    <AlertTriangle className="w-3 h-3 text-rose-500" />
                  )}
                </div>
              </div>

              <div className="ml-auto flex items-center gap-3">
                {visit.woundStatus && (
                  <Badge
                    variant="outline"
                    className={`hidden sm:flex items-center gap-1 ${getWoundStatusColor(visit.woundStatus)}`}
                  >
                    <Thermometer className="w-3 h-3" />
                    {visit.woundStatus}
                  </Badge>
                )}
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${openVisitIdx === idx ? "rotate-180" : ""}`}
                />
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent className="pt-2">
              <Card className="border-t-0 rounded-t-none border-x-0 bg-slate-50/30 dark:bg-slate-900/30 shadow-none">
                <CardContent className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Column 1: Vitals & Status */}
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1 p-3 bg-white dark:bg-slate-800 rounded-lg border">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                          <Weight className="w-3 h-3" /> Weight
                        </label>
                        <p className="text-lg font-bold">
                          {visit.weight ? `${visit.weight}` : "—"}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            kg
                          </span>
                        </p>
                      </div>
                      <div className="flex-1 p-3 bg-white dark:bg-slate-800 rounded-lg border">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">
                          BMI
                        </label>
                        <p className="text-lg font-bold">{visit.bmi || "—"}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">
                        Wound Status
                      </label>
                      <p className="mt-1 font-medium text-sm">
                        {visit.woundStatus || "Not assessed"}
                      </p>
                    </div>
                  </div>

                  {/* Column 2: Clinical Findings */}
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                        Clinical Findings
                      </label>
                      <p className="text-sm mt-1 text-slate-700 dark:text-slate-300 leading-relaxed italic">
                        &ldquo;
                        {visit.clinicalFindings || "No exam notes provided."}
                        &rdquo;
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-md border border-blue-100 dark:border-blue-900/20">
                        <label className="text-[10px] font-bold text-blue-700 uppercase flex items-center gap-1">
                          <Pill className="w-3 h-3" /> New Prescriptions
                        </label>
                        <div className="text-xs mt-2 whitespace-pre-wrap">
                          {visit.newPrescriptions
                            ? typeof visit.newPrescriptions === "string"
                              ? visit.newPrescriptions
                              : JSON.stringify(visit.newPrescriptions, null, 2)
                            : "None"}
                        </div>
                      </div>
                      <div className="p-3 bg-slate-100/50 rounded-md border border-slate-200">
                        <label className="text-[10px] font-bold text-slate-700 uppercase">
                          Follow-up Plan
                        </label>
                        <p className="text-xs mt-1 font-medium">
                          {visit.nextAppointmentDate
                            ? `Scheduled for: ${format(new Date(visit.nextAppointmentDate), "PP")}`
                            : "No follow-up scheduled"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        ))
      ) : (
        /* EMPTY STATE WHEN FILTERING RETURNS NOTHING */
        <div className="text-center p-8 border border-dashed rounded-lg bg-muted/10">
          <p className="text-sm text-muted-foreground italic">
            No visits found for {new Date(dateFilter).toLocaleDateString()}.
          </p>
          <Button
            variant="link"
            size="sm"
            onClick={() => setDateFilter("")}
            className="mt-2"
          >
            Clear filter to see all visits
          </Button>
        </div>
      )}
    </div>
  );
}

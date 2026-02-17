"use client";

import { updatePatientRecord } from "@/actions/patient-actions/medical-record-actions";
import SurgeriesForm from "@/components/patient-form/patient-surgeries-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { medicalRecordFormSchema } from "@/drizzle/general-medical-history";
import { PatientSurgery } from "@/drizzle/schemas/patient_surgeries";
import { formatDateLocal } from "@/lib/helpers/format-date-local";
import { getPatientSurgeryById } from "@/lib/server/patient-surgery-by-id";
import { medicalRecordFormOpts, useAppForm } from "@/lib/tansack-form";
import { useQuery } from "@tanstack/react-query";
import { Calendar, ChevronDown, Filter, Scale, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";

export default function PatientSurgerySection({ id }: { id: string }) {
  const [dateFilter, setDateFilter] = useState<string>(""); // YYYY-MM-DD string
  const [isEditing, setIsEditing] = useState(false);
  const [, setServerError] = useState<string | null>(null);

  const { data: surgeryDataFromQuery } = useQuery({
    queryKey: ["patient", "surgery", id],
    queryFn: () => getPatientSurgeryById({ patientId: id }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  const surgeries = useMemo(() => {
    if (Array.isArray(surgeryDataFromQuery)) return surgeryDataFromQuery;
    if (surgeryDataFromQuery) return [surgeryDataFromQuery];
    return [];
  }, [surgeryDataFromQuery]);

  const form = useAppForm({
    ...medicalRecordFormOpts,
    onSubmit: async ({ value }) => {
      setServerError(null);
      startTransition(async () => {
        try {
          const parsed = medicalRecordFormSchema.partial().safeParse(value);
          if (!parsed.success) {
            setServerError("Please check required fields.");
            return;
          }
          const result = await updatePatientRecord({
            patientId: id,
            data: {
              patientSurgeries: parsed.data.patientSurgeries,
            },
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
    form.setFieldValue("patientSurgeries", surgeries);
  }, [surgeries, form]);

  const [openGroupIndex, setOpenGroupIndex] = useState<number | null>(0);

  // --- 1. EXTRACT AVAILABLE DATES ---
  const availableDates = useMemo(() => {
    if (!surgeries) return [];
    const dates = new Set<string>();

    surgeries.forEach((surgery) => {
      if (surgery.surgeryDate) {
        try {
          dates.add(formatDateLocal(surgery.surgeryDate));
        } catch (e) {
          console.warn("Invalid date format for surgery:", e);
        }
      }
    });

    // Sort Descending (Newest first)
    return Array.from(dates).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime(),
    );
  }, [surgeries]);

  // --- 2. FILTER LOGIC ---
  const filteredSurgeries = useMemo(() => {
    if (!dateFilter) return surgeries;
    return surgeries.filter((surgery) => {
      if (!surgery.surgeryDate) return false;
      return formatDateLocal(surgery.surgeryDate) === dateFilter;
    });
  }, [surgeries, dateFilter]);

  // --- 3. GROUPING LOGIC (Applied to Filtered Data) ---
  const groupByDate = (items: PatientSurgery[]) => {
    const grouped: { [key: string]: PatientSurgery[] } = {};
    items.forEach((item) => {
      const date = new Date(item.surgeryDate || "");
      const key = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
    return Object.entries(grouped)
      .sort(
        ([dateA], [dateB]) =>
          new Date(dateB).getTime() - new Date(dateA).getTime(),
      )
      .map(([date, items]) => ({ date, items }));
  };

  const groupedSurgeries = groupByDate(filteredSurgeries);

  // --- Auto-scroll Logic ---
  const searchParams = useSearchParams();
  const surgeryIdParam = searchParams?.get?.("surgeryId");

  useEffect(() => {
    if (!surgeryIdParam) return;
    const idParam = String(surgeryIdParam);
    let scrollTimeout: number | undefined;
    const findTimeout = window.setTimeout(() => {
      const foundIdx = groupedSurgeries.findIndex((g) =>
        g.items.some((s) => String(s.id) === idParam),
      );

      if (foundIdx !== -1) {
        setOpenGroupIndex(foundIdx);
        scrollTimeout = window.setTimeout(() => {
          const el = document.getElementById(`surgery-${idParam}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 250);
      }
    }, 500);

    return () => {
      window.clearTimeout(findTimeout);
      if (scrollTimeout) window.clearTimeout(scrollTimeout);
    };
  }, [surgeryIdParam, groupedSurgeries]);

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-muted/30 p-3 rounded-xl border border-dashed">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">
              Operative Reports
            </h2>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                form.setFieldValue("patientSurgeries", surgeries);
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={() => form.handleSubmit()}>Save</Button>
          </div>
        </div>
        <SurgeriesForm form={form} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* HEADER WITH FILTER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-muted/30 p-3 rounded-xl border border-dashed gap-3">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">
            Operative Reports
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
                <option value="">All Surgeries</option>
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

      {/* RENDER GROUPS */}
      {surgeries.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center py-12 text-gray-500">
            <Scale className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No surgery records found for this patient</p>
          </CardContent>
        </Card>
      ) : groupedSurgeries.length > 0 ? (
        groupedSurgeries.map((group, groupIdx) => (
          <Collapsible
            key={groupIdx}
            open={openGroupIndex === groupIdx}
            onOpenChange={(open) => setOpenGroupIndex(open ? groupIdx : null)}
            className="mb-2"
          >
            <CollapsibleTrigger className="flex items-center gap-2 p-3 bg-muted/50 hover:bg-muted rounded-lg w-full transition-colors group">
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  openGroupIndex === groupIdx ? "rotate-180" : ""
                }`}
              />
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{group.date}</span>
              <span className="text-xs text-muted-foreground ml-auto bg-background px-2 py-0.5 rounded-full border">
                {group.items.length}{" "}
                {group.items.length === 1 ? "surgery" : "surgeries"}
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 pl-2 sm:pl-6 space-y-3">
              {group.items.map((surgery, idx) => (
                <Card
                  id={`surgery-${surgery.id}`}
                  key={surgery.id || idx}
                  className="overflow-hidden border-l-4 border-l-blue-500 shadow-sm"
                >
                  <CardHeader className="bg-muted/30 px-4 py-3">
                    <CardTitle className="text-sm flex items-center justify-between gap-2">
                      <span className="font-bold text-primary uppercase tracking-wide">
                        {surgery.procedureType}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-xs bg-background"
                      >
                        {surgery.procedureName}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Left Column */}
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                            Surgeon
                          </label>
                          <p className="text-sm font-medium">
                            {surgery.surgeonName || "—"}
                          </p>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                            Hospital
                          </label>
                          <p className="text-sm font-medium">
                            {surgery.hospitalName || "—"}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                              First Assistant
                            </label>
                            <p className="text-sm font-medium">
                              {surgery.firstAssistant || "—"}
                            </p>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                              Second Assistant
                            </label>
                            <p className="text-sm font-medium">
                              {surgery.secondAssistant || "—"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                              Camera
                            </label>
                            <p className="text-sm font-medium">
                              {surgery.cameraMan || "—"}
                            </p>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                              Dissection
                            </label>
                            <p className="text-sm font-medium">
                              {surgery.dissectionBy || "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Operative Notes */}
                    {(surgery.summaryNotes || surgery.operativeNotes) && (
                      <div className="mt-4 pt-4 border-t">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                          Operative Notes
                        </label>
                        <div className="p-3 bg-muted/50 rounded-md border border-border text-sm text-gray-900 dark:text-gray-100 max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed font-mono">
                          {surgery.summaryNotes ||
                            surgery.operativeNotes ||
                            "No operative notes available."}
                        </div>
                      </div>
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
            No surgeries found for {new Date(dateFilter).toLocaleDateString()}.
          </p>
          <Button
            variant="link"
            size="sm"
            onClick={() => setDateFilter("")}
            className="mt-2"
          >
            Clear filter to see all surgeries
          </Button>
        </div>
      )}
    </div>
  );
}

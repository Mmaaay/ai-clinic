"use client";
import { updatePatientRecord } from "@/actions/patient-actions/medical-record-actions";
import PatientFollowupForm from "@/components/patient-form/patient-followup-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { medicalRecordFormSchema } from "@/drizzle/general-medical-history";
import { PatientFollowup } from "@/drizzle/schemas/patient_follow-up";
import { formatDateLocal } from "@/lib/helpers/format-date-local";
import { getPatientFollowupById } from "@/lib/server/patient-followup-by-id";
import { medicalRecordFormOpts, useAppForm } from "@/lib/tansack-form";
import { useQuery } from "@tanstack/react-query";
import { Calendar, ChevronDown, Clipboard, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";

export default function PatientFollowupSection({ id }: { id: string }) {
  const [dateFilter, setDateFilter] = useState<string>(""); // YYYY-MM-DD string
  const [isEditing, setIsEditing] = useState(false);
  const [, setServerError] = useState<string | null>(null);

  const router = useRouter();

  const { data: followupDataFromQuery } = useQuery({
    queryKey: ["patient", "followup", id],
    queryFn: () => getPatientFollowupById({ patientId: id }),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const followups = useMemo(() => {
    if (Array.isArray(followupDataFromQuery)) return followupDataFromQuery;
    if (followupDataFromQuery) return [followupDataFromQuery];
    return [];
  }, [followupDataFromQuery]) as PatientFollowup[];

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
          router.push("/");
        } catch (error) {
          console.error("Error:", error);
          setServerError("An unexpected error occurred");
        }
      });
    },
  });

  useEffect(() => {
    form.setFieldValue("patientFollowups", followups);
  }, [followups, form]);

  // --- 1. EXTRACT AVAILABLE DATES (Smart Dropdown Source) ---
  const availableDates = useMemo(() => {
    if (!followups) return [];
    const dates = new Set<string>();

    followups.forEach((fup) => {
      const dateVal = fup.callDate || fup.scheduledVisitDate;
      if (dateVal) {
        try {
          dates.add(formatDateLocal(dateVal));
        } catch (e) {
          console.error("Error parsing date for follow-up record:", e);
        }
      }
    });

    // Sort Descending (Newest first)
    return Array.from(dates).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime(),
    );
  }, [followups]);

  // --- 2. FILTER LOGIC ---
  const filteredFollowups = useMemo(() => {
    if (!dateFilter) return followups;
    return followups.filter((fup) => {
      const dateVal = fup.callDate || fup.scheduledVisitDate;
      if (!dateVal) return false;
      const fupDate = formatDateLocal(dateVal);
      return fupDate === dateFilter;
    });
  }, [followups, dateFilter]);

  // --- 3. GROUPING LOGIC (Applied to FILTERED data) ---
  const groupByDate = (items: PatientFollowup[]) => {
    const grouped: { [key: string]: PatientFollowup[] } = {};
    items.forEach((item) => {
      const dateVal = item.callDate || item.scheduledVisitDate || item.callDate;
      const date = dateVal ? new Date(dateVal) : new Date();
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

  const grouped = groupByDate(filteredFollowups);

  // --- Auto-Scroll Logic for Deep Links ---
  const searchParams = useSearchParams();
  const followupIdParam = searchParams?.get?.("followupId");
  const [openGroupIndex, setOpenGroupIndex] = useState<number | null>(
    grouped.length ? 0 : null,
  );

  useEffect(() => {
    if (!followupIdParam) return;
    const idParam = String(followupIdParam);
    const foundIdx = grouped.findIndex((g) =>
      g.items.some((f) => String(f.id) === idParam),
    );
    if (foundIdx !== -1) {
      const timer = setTimeout(() => {
        setOpenGroupIndex(foundIdx);
        const el = document.getElementById(`followup-${idParam}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 250);

      return () => clearTimeout(timer);
    }
  }, [followupIdParam, grouped]);

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-muted/30 p-3 rounded-xl border border-dashed">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">Follow-ups</h2>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                form.setFieldValue("patientFollowups", followups);
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={() => form.handleSubmit()}>Save</Button>
          </div>
        </div>
        <PatientFollowupForm form={form} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* HEADER WITH FILTER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-muted/30 p-3 rounded-xl border border-dashed gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">Follow-ups</h2>
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
                <option value="">All Records</option>
                <optgroup label="Filter by Creation Date">
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
              <Calendar className="absolute right-2.5 top-2.5 w-4 h-4 text-muted-foreground opacity-50 pointer-events-none" />
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
      {followups.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center py-12 text-gray-500">
            <Clipboard className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No follow-up records found for this patient</p>
          </CardContent>
        </Card>
      ) : grouped.length > 0 ? (
        grouped.map((group, groupIdx) => (
          <Collapsible
            key={groupIdx}
            open={openGroupIndex === groupIdx}
            onOpenChange={(open) => setOpenGroupIndex(open ? groupIdx : null)}
            className="mb-2"
          >
            <CollapsibleTrigger className="flex items-center gap-2 p-3 bg-muted/50 hover:bg-muted rounded-lg w-full transition-colors group">
              <ChevronDown className="w-4 h-4 transition-transform group-data-[state=open]:rotate-180" />
              <span className="text-sm font-medium">{group.date}</span>
              <span className="text-xs text-muted-foreground ml-auto bg-background px-2 py-0.5 rounded-full border">
                {group.items.length}{" "}
                {group.items.length === 1 ? "record" : "records"}
              </span>
            </CollapsibleTrigger>

            <CollapsibleContent className="pt-2 pl-2 sm:pl-6 space-y-3">
              {group.items.map((fup, idx) => (
                <Card
                  id={`followup-${fup.id}`}
                  key={fup.id || idx}
                  className="overflow-hidden border-l-4 border-l-emerald-500 shadow-sm"
                >
                  <CardHeader className="bg-muted/30 px-4 py-3">
                    <CardTitle className="text-sm flex items-center justify-between gap-2">
                      <span className="font-bold text-primary uppercase tracking-wide">
                        {fup.callDate
                          ? new Date(fup.callDate).toLocaleString()
                          : "Follow-up Record"}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-xs bg-background"
                      >
                        BM: {fup.bowelMovement || "—"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* LEFT COLUMN */}
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                            Scheduled Visit
                          </label>
                          <p className="text-sm font-medium">
                            {fup.scheduledVisitDate
                              ? new Date(
                                  fup.scheduledVisitDate,
                                ).toLocaleString()
                              : "—"}
                          </p>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                            Medication Adherence
                          </label>
                          <div className="text-sm font-medium bg-muted/30 p-2 rounded border border-dashed">
                            {fup.medicationAdherence
                              ? typeof fup.medicationAdherence === "string"
                                ? fup.medicationAdherence
                                : JSON.stringify(
                                    fup.medicationAdherence,
                                    null,
                                    2,
                                  )
                              : "—"}
                          </div>
                        </div>
                      </div>

                      {/* RIGHT COLUMN */}
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                            Diet / Activity
                          </label>
                          <p className="text-sm font-medium">
                            <span className="text-muted-foreground">Diet:</span>{" "}
                            {fup.dietNotes || "—"}
                            <br />
                            <span className="text-muted-foreground">
                              Activity:
                            </span>{" "}
                            {fup.activityLevel || "—"}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                              Urine
                            </label>
                            <p className="text-sm font-medium">
                              {fup.urineFrequency || "—"}
                            </p>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                              Spirometer
                            </label>
                            <p className="text-sm font-medium">
                              {fup.spirometer || "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SYMPTOMS SECTION */}
                    {fup.symptoms && (
                      <div className="mt-4 pt-4 border-t">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                          Reported Symptoms
                        </label>
                        <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-100 dark:border-red-900 text-sm whitespace-pre-wrap">
                          {typeof fup.symptoms === "string"
                            ? fup.symptoms
                            : JSON.stringify(fup.symptoms, null, 2)}
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
            No records found for {new Date(dateFilter).toLocaleDateString()}.
          </p>
          <Button
            variant="link"
            size="sm"
            onClick={() => setDateFilter("")}
            className="mt-2"
          >
            Clear filter to see all records
          </Button>
        </div>
      )}
    </div>
  );
}

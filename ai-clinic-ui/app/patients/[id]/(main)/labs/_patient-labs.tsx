"use client";

import { updatePatientRecord } from "@/actions/patient-actions/medical-record-actions";
import LabsForm from "@/components/patient-form/patient-labs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { medicalRecordFormSchema } from "@/drizzle/general-medical-history";
import { PatientLabsRecord } from "@/drizzle/schemas/patient_labs";
import { formatDateLocal } from "@/lib/helpers/format-date-local";
import { getPatientLabsById } from "@/lib/server/patient-labs-by-id";
import { medicalRecordFormOpts, useAppForm } from "@/lib/tansack-form";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Beaker,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Filter,
  FlaskConical,
  Search,
  X,
} from "lucide-react";
import { startTransition, useEffect, useMemo, useState } from "react";

// Types from your schema
type LabRecord = PatientLabsRecord;

// --- 1. LEVENSHTEIN DISTANCE ALGORITHM (The "Fuzzy" Logic) ---
const levenshtein = (a: string, b: string): number => {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1, // deletion
          ),
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

// --- 2. FUZZY MATCHER HELPER ---
const isFuzzyMatch = (
  text: string | null | undefined,
  query: string,
): boolean => {
  if (!text || !query) return false;
  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase();

  // A. Exact Substring Match (Fastest & most common)
  if (normalizedText.includes(normalizedQuery)) return true;

  // B. Similarity Match (Handles "ham" -> "haemoglobin")
  // We split the text into words to check against specific terms
  const words = normalizedText.split(/[\s-_]+/);

  return words.some((word) => {
    // Optimization: Don't fuzzy match distinctively short words against long queries
    if (Math.abs(word.length - normalizedQuery.length) > 3) return false;

    // 1. Compare query against the *start* of the word (prefix matching with error)
    //    e.g. Query "ham" (len 3) vs Word "haemoglobin"
    //    We compare "ham" vs "haem" (first 4 chars). Distance is 1. Match!
    const prefixLength = Math.min(word.length, normalizedQuery.length + 1);
    const wordPrefix = word.substring(0, prefixLength);

    const distance = levenshtein(wordPrefix, normalizedQuery);

    // Threshold: Allow 1 error for short queries, 2 for longer ones
    const allowedErrors = normalizedQuery.length > 4 ? 2 : 1;

    return distance <= allowedErrors;
  });
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Final":
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case "Pending":
      return <Clock className="w-4 h-4 text-yellow-500" />;
    case "Cancelled":
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    default:
      return null;
  }
};

export default function PatientLabsSection({ id }: { id: string }) {
  const [dateFilter, setDateFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [, setServerError] = useState<string | null>(null);

  const { data: labData, isLoading } = useQuery({
    queryKey: ["patient", "labs", id],
    queryFn: () => getPatientLabsById({ patientId: id }),
    staleTime: 1000 * 60 * 5,
  });

  const [openGroupIndex, setOpenGroupIndex] = useState<number | null>(0);

  const records = useMemo<LabRecord[]>(() => {
    if (Array.isArray(labData)) return labData;
    if (labData) return [labData];
    return [];
  }, [labData]);

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
    form.setFieldValue("patientLabs", records);
  }, [records, form]);

  const availableDates = useMemo(() => {
    if (!records) return [];
    const dates = new Set<string>();
    records.forEach((lab) => {
      if (lab.labDate) {
        try {
          dates.add(formatDateLocal(lab.labDate));
        } catch {
          /* ignore invalid date */
        }
      }
    });
    return Array.from(dates).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime(),
    );
  }, [records]);

  // --- 3. FILTER LOGIC USING FUZZY MATCH ---
  const filteredRecords = useMemo(() => {
    let result = records;

    // Date Filter
    if (dateFilter) {
      result = result.filter((lab) => {
        if (!lab.labDate) return false;
        return formatDateLocal(lab.labDate) === dateFilter;
      });
    }

    // Fuzzy Search Filter
    if (searchQuery.trim()) {
      const query = searchQuery.trim();

      result = result.filter((lab) => {
        // Check main fields
        const matchName = isFuzzyMatch(lab.testName, query);
        const matchCategory = isFuzzyMatch(lab.category, query);
        const matchNotes = isFuzzyMatch(lab.notes, query);

        // Check inside Results object (Keys and Values)
        let matchResults = false;
        if (lab.results && typeof lab.results === "object") {
          matchResults = Object.entries(lab.results).some(
            ([key, val]) =>
              isFuzzyMatch(key, query) || isFuzzyMatch(String(val), query),
          );
        }

        return matchName || matchCategory || matchNotes || matchResults;
      });
    }

    return result;
  }, [records, dateFilter, searchQuery]);

  // Grouping Logic
  const groupByDate = (items: LabRecord[]) => {
    const grouped: { [key: string]: LabRecord[] } = {};
    items.forEach((item) => {
      const date = item.labDate ? new Date(item.labDate) : new Date();
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

  const groupedLabs = groupByDate(filteredRecords);

  if (isLoading)
    return <div className="p-4 animate-pulse">Loading lab reports...</div>;

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-muted/30 p-3 rounded-xl border border-dashed">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold tracking-tight">
              Laboratory Reports
            </h2>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                form.setFieldValue("patientLabs", records);
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={() => form.handleSubmit()}>Save</Button>
          </div>
        </div>
        <LabsForm form={form} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-muted/30 p-3 rounded-xl border border-dashed gap-3">
        <div className="flex items-center gap-2">
          <Beaker className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base sm:text-lg font-semibold tracking-tight">
            Laboratory Reports
          </h2>
        </div>

        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
          Edit
        </Button>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* SEARCH INPUT */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search (e.g., ham, cbc)..."
              className="pl-9 h-9 text-xs bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* DATE FILTER */}
          {availableDates.length > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto relative">
              <div className="relative w-full sm:w-auto">
                <select
                  className="h-9 w-full sm:w-40 text-xs bg-background border border-input rounded-md pl-3 pr-8 focus:ring-1 focus:ring-ring appearance-none"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="">All Dates</option>
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
                  title="Clear date filter"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RENDER LIST */}
      {records.length === 0 ? (
        <Card className="border-dashed py-12 text-center text-muted-foreground">
          <CardContent>
            <FlaskConical className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>No lab results available for this patient</p>
          </CardContent>
        </Card>
      ) : groupedLabs.length > 0 ? (
        groupedLabs.map((group, groupIdx) => (
          <Collapsible
            key={groupIdx}
            open={openGroupIndex === groupIdx}
            onOpenChange={(open) => setOpenGroupIndex(open ? groupIdx : null)}
          >
            <CollapsibleTrigger className="flex items-center gap-2 p-3 bg-muted/50 hover:bg-muted rounded-lg w-full transition-all group">
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  openGroupIndex === groupIdx ? "rotate-180" : ""
                }`}
              />
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{group.date}</span>
              <Badge variant="secondary" className="ml-auto bg-background">
                {group.items.length}{" "}
                {group.items.length === 1 ? "test" : "tests"}
              </Badge>
            </CollapsibleTrigger>

            <CollapsibleContent className="pt-2 pl-2 sm:pl-4 space-y-4">
              {group.items.map((lab, idx) => (
                <Card
                  key={idx}
                  className="border-l-4 border-l-indigo-500 shadow-sm"
                >
                  <CardHeader className="px-4 py-3 flex flex-row items-center justify-between bg-indigo-50/30">
                    <div className="space-y-1">
                      {/* Highlight the name if it matches query */}
                      <CardTitle className="text-sm font-bold uppercase tracking-tight">
                        {lab.testName}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-background"
                        >
                          {lab.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(lab.status!)}
                      <span className="text-xs font-semibold">
                        {lab.status}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4">
                    {lab.results && typeof lab.results === "object" && (
                      <div className="border rounded-md overflow-hidden mb-4">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-muted text-muted-foreground">
                            <tr>
                              <th className="p-2 font-bold uppercase">
                                Parameter
                              </th>
                              <th className="p-2 font-bold uppercase">Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {Object.entries(
                              lab.results as Record<string, unknown>,
                            ).map(([key, value]) => (
                              <tr
                                key={key}
                                className="hover:bg-muted/50 transition-colors"
                              >
                                <td className="p-2 font-medium capitalize">
                                  {key.replace(/_/g, " ")}
                                </td>
                                <td className="p-2 font-mono text-indigo-600 dark:text-indigo-400">
                                  {String(value)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {lab.notes && (
                      <div className="mt-2 text-sm bg-muted/30 p-3 rounded border border-dashed">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                          Pathologist Notes
                        </label>
                        <p className="text-gray-700 dark:text-gray-300 italic leading-relaxed">
                          &quot;{lab.notes}&quot;
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ))
      ) : (
        <div className="text-center p-8 border border-dashed rounded-lg bg-muted/10">
          <p className="text-sm text-muted-foreground italic">
            No lab reports found matching &quot;{searchQuery}&quot;
          </p>
          <Button
            variant="link"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="mt-2"
          >
            Clear Search
          </Button>
        </div>
      )}
    </div>
  );
}

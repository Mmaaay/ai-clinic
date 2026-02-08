"use client";

import { createPatientRecord } from "@/actions/patient-actions/medical-record-actions";
import PatientBackgroundForm from "@/components/patient-form/patient-background-form";
import PatientFollowupForm from "@/components/patient-form/patient-followup-form";
import ImagingForm from "@/components/patient-form/patient-imaging-form";
import LabsForm from "../../../components/patient-form/patient-labs";
import NotesForm from "@/components/patient-form/patient-notes-form";
import VisitsForm from "@/components/patient-form/patient-visits-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  medicalRecordForm,
  medicalRecordFormSchema,
} from "@/drizzle/general-medical-history";
import { useAppForm, medicalRecordFormOpts } from "@/lib/tansack-form";
import {
  Activity,
  Building,
  Calendar,
  CalendarClock,
  FileText,
  Globe,
  Hash,
  Loader2,
  MapPin,
  Phone,
  Ruler,
  ScanLine,
  User,
  UserCircle,
  Weight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense, useState, useTransition } from "react";
import { PatientAllergy } from "@/drizzle/schemas/medical-background/patient_allergies";
import { PatientSocialHistory } from "@/drizzle/schemas/medical-background/patient_social_history";
import { PatientFollowup } from "@/drizzle/schemas/patient_follow-up";
import { PatientImagingRecord } from "@/drizzle/schemas/patient_images";
import { PatientVisitsRecord } from "@/drizzle/schemas/patient_visits";
import { PatientNotesRecord } from "@/drizzle/schemas/patient_notes";

// --- Helpers ---
function sanitizePhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const map: Record<string, string> = {
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
    "۰": "0",
    "۱": "1",
    "۲": "2",
    "۳": "3",
    "۴": "4",
    "۵": "5",
    "۶": "6",
    "۷": "7",
    "۸": "8",
    "۹": "9",
  };
  return phone
    .replace(/[٠-٩۰-۹]/g, (char) => map[char] || char)
    .replace(/\D/g, "");
}

function safeDate(dateInput: string | null | undefined): Date | null {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  return isNaN(d.getTime()) ? null : d;
}

function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0]; // Returns "YYYY-MM-DD"
}

function AddPatientForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState("");
  const [activeTab, setActiveTab] = useState("details");

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
          const result = await createPatientRecord(parsed.data);
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

  const computeBmi = (
    height: number | null | undefined,
    weight: number | null | undefined,
  ) => {
    if (!height || !weight) return "—";
    return (weight / (height / 100) ** 2).toFixed(1);
  };

  const onSubmit = () => form.handleSubmit();

  const handleScan = async (file: File) => {
    setScanError(null);
    setServerError(null);
    setIsScanning(true);
    setScanProgress(0);
    setScanStatus("starting");

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/ocr/stream", {
        method: "POST",
        body: formData,
      });

      if (!response.ok || !response.body) {
        const text = await response.text();
        throw new Error(text || "Failed to scan document");
      }

      const decoder = new TextDecoder();
      const reader = response.body.getReader();
      let buffer = "";

      const toArray = <T,>(value: T | T[] | null | undefined): T[] =>
        Array.isArray(value) ? value : value ? [value] : [];
      const currentValues = form.state.values as medicalRecordForm;

      const handleResult = (result: unknown) => {
        const extraction =
          (result as { extraction?: Record<string, unknown> } | null)
            ?.extraction || {};
        const history =
          (extraction as { history?: Record<string, unknown> }).history || {};
        const extractionPatient =
          (extraction as { patient?: Record<string, unknown> }).patient || {};
        const extractionLabs =
          (extraction as { labs?: Record<string, unknown> }).labs || {};
        const mapOcrToForm: medicalRecordForm = {
          ...currentValues,
          patientAllergies: toArray(history.patientAllergies as PatientAllergy),
          patientConditions: toArray(history.patientConditions as unknown).map(
            (c) => {
              const item = c as Record<string, unknown>;
              return {
                ...item,
                onsetDate: safeDate(
                  item.onsetDate as string | null | undefined,
                ),
              };
            },
          ),
          patientMedications: toArray(
            history.patientMedications as unknown,
          ).map((m) => {
            const item = m as Record<string, unknown>;
            return {
              ...item,
              startDate: safeDate(item.startDate as string | null | undefined),
            };
          }),
          patientSocialHistory: toArray(
            history.patientSocialHistory as PatientSocialHistory,
          ),
          patientSurgeries: toArray(history.patientSurgeries as unknown).map(
            (s) => {
              const item = s as Record<string, unknown>;
              return {
                ...item,
                surgeryDate: safeDate(
                  item.surgeryDate as string | null | undefined,
                ),
              };
            },
          ),
          patient: {
            ...currentValues.patient,
            name:
              (extractionPatient.name as string | undefined) ||
              currentValues.patient.name,
            nameAr: (extractionPatient.name_ar as string | undefined) || "",
            age:
              (extractionPatient.age as number | null | undefined) ??
              currentValues.patient.age,
            gender:
              (extractionPatient.gender as string | undefined) ||
              currentValues.patient.gender,
            phone:
              sanitizePhone(
                extractionPatient.phone as string | null | undefined,
              ) || currentValues.patient.phone,
            height:
              (extractionPatient.height as number | null | undefined) || null,
            initial_weight:
              (extractionPatient.initial_weight as number | null | undefined) ||
              null,
            clinic_address:
              (extractionPatient.clinic_address as string | undefined) || "",
            residency:
              (extractionPatient.residency as string | undefined) || "",
            referral: (extractionPatient.referral as string | undefined) || "",
            first_visit_date: safeDate(
              extractionPatient.first_visit_date as string | null | undefined,
            ),
            dob: safeDate(extractionPatient.dob as string | null | undefined),
          },
          patientFollowups: toArray(
            (extraction as { followups?: PatientFollowup }).followups,
          ),
          patientLabs: toArray(extractionLabs.labs as unknown).map((l) => {
            const item = l as Record<string, unknown> & {
              results?: Record<string, unknown>;
            };
            const results = item.results || {};
            return {
              ...item,
              labDate: safeDate(
                (item.labDate as string | null | undefined) ||
                  (item.lab_date as string | null | undefined),
              ),
              results: {
                value:
                  (results.value as string | undefined) ||
                  (item.value as string | undefined) ||
                  "",
                unit:
                  (results.unit as string | undefined) ||
                  (item.unit as string | undefined) ||
                  "",
              },
            };
          }),
          patientImaging: toArray(
            (extraction as { imaging?: PatientImagingRecord[] }).imaging,
          ).map((i) => {
            const item = i as Record<string, unknown>;
            return {
              ...item,
              imageDate: safeDate(
                (item.imageDate as string | null | undefined) ||
                  (item.image_date as string | null | undefined),
              ),
            } as unknown as PatientImagingRecord;
          }),
          patientVisits: toArray(
            (extraction as { visits?: PatientVisitsRecord }).visits,
          ),
          patientNotes: toArray(
            (extraction as { notes?: PatientNotesRecord }).notes,
          ).map((n) => {
            const item = n as Record<string, unknown>;
            return {
              ...item,
              noteDate: safeDate(item.noteDate as string | null | undefined),
            } as unknown as PatientNotesRecord;
          }),
        };

        const validated = medicalRecordFormSchema.safeParse(mapOcrToForm);
        if (!validated.success) {
          throw new Error("Validation failed for OCR data.");
        }

        form.reset(validated.data);
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const lines = part.split("\n");
          const eventLine = lines.find((line) => line.startsWith("event:"));
          const dataLine = lines.find((line) => line.startsWith("data:"));
          if (!dataLine) continue;

          const event = eventLine?.replace("event:", "").trim() || "message";
          const data = JSON.parse(dataLine.replace("data:", "").trim());

          if (event === "progress") {
            setScanProgress(Number(data.percent) || 0);
            setScanStatus(data.message || "");
          }

          if (event === "error") {
            throw new Error(data.error || "Failed to scan document");
          }

          if (event === "result") {
            setScanProgress(100);
            setScanStatus("done");
            handleResult(data);
          }
        }
      }
    } catch (error) {
      setScanError(error instanceof Error ? error.message : "Scan failed");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* HEADER */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              ← Back
            </Button>
            <div>
              <h1 className="text-xl font-bold">Add Patient</h1>
              <p className="text-xs text-muted-foreground">
                New Medical Record
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <label
              className={`btn-primary relative cursor-pointer inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent ${isScanning ? "opacity-50" : ""}`}
            >
              <input
                type="file"
                accept=".pdf,image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleScan(e.target.files[0]);
                  e.target.value = "";
                }}
                disabled={isScanning}
              />
              {isScanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scanning
                </>
              ) : (
                <>
                  <ScanLine className="mr-2 h-4 w-4" /> Scan PDF
                </>
              )}
            </label>
            <Button
              onClick={onSubmit}
              disabled={isPending || isScanning}
              className="min-w-25"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save Record"
              )}
            </Button>
          </div>
        </div>
        {(serverError || scanError) && (
          <div className="container mx-auto px-4 pb-2">
            <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {serverError || scanError}
            </div>
          </div>
        )}
        {isScanning && (
          <div className="container mx-auto px-4 pb-2">
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
              <div className="flex items-center justify-between mb-2">
                <span>Scanning document...</span>
                <span>{scanProgress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-blue-100">
                <div
                  className="h-2 rounded-full bg-blue-600 transition-all"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
              {scanStatus && (
                <div className="mt-2 text-xs text-blue-600">{scanStatus}</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="flex-1 container mx-auto px-4 py-6 max-w-5xl">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="flex flex-wrap justify-start gap-2 bg-muted p-1 h-auto">
            <TabsTrigger value="details" className="gap-2 px-4">
              <UserCircle className="w-4 h-4" /> Demographics
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2 px-4">
              <FileText className="w-4 h-4" /> History
            </TabsTrigger>
            <TabsTrigger value="followup" className="gap-2 px-4">
              <CalendarClock className="w-4 h-4" /> Follow Up
            </TabsTrigger>
            <TabsTrigger value="labs" className="gap-2 px-4">
              Labs
            </TabsTrigger>
            <TabsTrigger value="imaging" className="gap-2 px-4">
              Imaging
            </TabsTrigger>
            <TabsTrigger value="visits" className="gap-2 px-4">
              Visits
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-2 px-4">
              Notes
            </TabsTrigger>
          </TabsList>

          {/* --- TAB 1: DEMOGRAPHICS (Styled Like Your Card) --- */}
          <TabsContent value="details" className="animate-in fade-in-50">
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl border border-dashed">
                <User className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold tracking-tight">
                  Patient Demographics
                </h2>
              </div>

              <Card className="overflow-hidden border-l-4 border-l-blue-500 shadow-sm">
                {/* Header: Name & Gender */}
                <CardHeader className="bg-muted/30 px-6 py-4">
                  <CardTitle className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="space-y-2 w-full md:w-1/2">
                      <form.Field name="patient.name">
                        {(field) => (
                          <Input
                            placeholder="Full Name (English)"
                            className={`text-lg font-bold h-10 ${field.state.meta!.errors.length ? "border-red-500" : ""}`}
                            value={field.state.value || ""}
                            onChange={(e) => field.handleChange(e.target.value)}
                          />
                        )}
                      </form.Field>
                      <form.Field name="patient.nameAr">
                        {(field) => (
                          <Input
                            placeholder="الاسم (Arabic - Optional)"
                            className="font-arabic text-right h-9"
                            value={field.state.value || ""}
                            onChange={(e) => field.handleChange(e.target.value)}
                          />
                        )}
                      </form.Field>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <form.Field name="patient.gender">
                        {(field) => (
                          <select
                            className="h-9 rounded-md border bg-background px-3 text-sm"
                            value={field.state.value || ""}
                            onChange={(e) => field.handleChange(e.target.value)}
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        )}
                      </form.Field>
                      <div className="relative">
                        <form.Field name="patient.age">
                          {(field) => (
                            <Input
                              type="number"
                              placeholder="Age"
                              className="w-20 h-9 pr-1"
                              value={field.state.value ?? ""}
                              onChange={(e) =>
                                field.handleChange(
                                  e.target.value
                                    ? Number(e.target.value)
                                    : null,
                                )
                              }
                            />
                          )}
                        </form.Field>
                        <span className="absolute right-2 top-2 text-xs text-muted-foreground pointer-events-none">
                          yrs
                        </span>
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* 1. Contact Info */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Phone className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          Contact
                        </span>
                      </div>
                      <form.Field name="patient.phone">
                        {(field) => (
                          <Input
                            placeholder="Primary Phone"
                            value={field.state.value || ""}
                            onChange={(e) => field.handleChange(e.target.value)}
                          />
                        )}
                      </form.Field>
                      <form.Field name="patient.optional_phone">
                        {(field) => (
                          <Input
                            placeholder="Alt Phone"
                            className="text-sm"
                            value={field.state.value || ""}
                            onChange={(e) => field.handleChange(e.target.value)}
                          />
                        )}
                      </form.Field>
                      <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                        <Hash className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          National ID
                        </span>
                      </div>
                    </div>

                    {/* 2. Address */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <MapPin className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          Location
                        </span>
                      </div>
                      <form.Field name="patient.residency">
                        {(field) => (
                          <Input
                            placeholder="Residency / City"
                            value={field.state.value || ""}
                            onChange={(e) => field.handleChange(e.target.value)}
                          />
                        )}
                      </form.Field>
                      <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                        <Building className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          Clinic
                        </span>
                      </div>
                      <form.Field name="patient.clinic_address">
                        {(field) => (
                          <Input
                            placeholder="Clinic Branch"
                            value={field.state.value || ""}
                            onChange={(e) => field.handleChange(e.target.value)}
                          />
                        )}
                      </form.Field>
                    </div>

                    {/* 3. Vitals & BMI */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Activity className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          Vitals
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                          <form.Field name="patient.height">
                            {(field) => (
                              <Input
                                type="number"
                                placeholder="Ht"
                                value={field.state.value ?? ""}
                                onChange={(e) =>
                                  field.handleChange(
                                    e.target.value
                                      ? Number(e.target.value)
                                      : null,
                                  )
                                }
                              />
                            )}
                          </form.Field>
                          <Ruler className="absolute right-2 top-2.5 w-3 h-3 text-muted-foreground" />
                        </div>
                        <div className="relative">
                          <form.Field name="patient.initial_weight">
                            {(field) => (
                              <Input
                                type="number"
                                placeholder="Wt"
                                value={field.state.value ?? ""}
                                onChange={(e) =>
                                  field.handleChange(
                                    e.target.value
                                      ? Number(e.target.value)
                                      : null,
                                  )
                                }
                              />
                            )}
                          </form.Field>
                          <Weight className="absolute right-2 top-2.5 w-3 h-3 text-muted-foreground" />
                        </div>
                      </div>
                      <form.Subscribe
                        selector={(state) => ({
                          height: state.values.patient?.height,
                          weight: state.values.patient?.initial_weight,
                        })}
                      >
                        {({ height, weight }) => {
                          const bmi = computeBmi(height, weight);
                          return (
                            <div className="flex items-center justify-between bg-muted/40 p-2 rounded-md border border-dashed">
                              <span className="text-xs font-medium text-muted-foreground">
                                Calculated BMI
                              </span>
                              <Badge
                                variant={
                                  Number(bmi) > 30 ? "destructive" : "secondary"
                                }
                              >
                                {bmi}
                              </Badge>
                            </div>
                          );
                        }}
                      </form.Subscribe>
                    </div>

                    {/* 4. Dates & Referral */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          Important Dates
                        </span>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Date of Birth
                        </Label>
                        <form.Field name="patient.dob">
                          {(field) => (
                            <Input
                              type="date"
                              value={formatDateForInput(field.state.value)}
                              onChange={(e) =>
                                field.handleChange(
                                  e.target.value
                                    ? new Date(e.target.value)
                                    : null,
                                )
                              }
                              className="block w-full"
                            />
                          )}
                        </form.Field>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          First Visit
                        </Label>
                        <form.Field name="patient.first_visit_date">
                          {(field) => (
                            <Input
                              type="date"
                              value={formatDateForInput(field.state.value)}
                              onChange={(e) =>
                                field.handleChange(
                                  e.target.value
                                    ? new Date(e.target.value)
                                    : null,
                                )
                              }
                              className="block w-full"
                            />
                          )}
                        </form.Field>
                      </div>
                      <div className="relative">
                        <Globe className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
                        <form.Field name="patient.referral">
                          {(field) => (
                            <Input
                              placeholder="Referral Source"
                              className="pl-8"
                              value={field.state.value || ""}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                            />
                          )}
                        </form.Field>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* OTHER TABS */}
          <TabsContent value="history">
            <PatientBackgroundForm form={form} />
          </TabsContent>
          <TabsContent value="followup">
            <PatientFollowupForm form={form} />
          </TabsContent>
          <TabsContent value="labs">
            <LabsForm form={form} />
          </TabsContent>
          <TabsContent value="imaging">
            <ImagingForm form={form} />
          </TabsContent>
          <TabsContent value="visits">
            <VisitsForm form={form} />
          </TabsContent>
          <TabsContent value="notes">
            <NotesForm form={form} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function AddPatientPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <AddPatientForm />
    </Suspense>
  );
}

"use client";

import { createPatientRecord } from "@/actions/patient-actions/medical-record-actions";
import { streamMedicalRecordFromPayload } from "@/actions/patient-actions/stream-medical-record";
import PatientBackgroundForm from "@/components/patient-form/patient-background-form";
import PatientFollowupForm from "@/components/patient-form/patient-followup-form";
import ImagingForm from "@/components/patient-form/patient-imaging-form";
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
  type PatientForm,
  type PatientAllergyForm,
  type PatientConditionForm,
  type PatientMedicationForm,
  type PatientSocialHistoryForm,
  type PatientSurgeryForm,
  type PatientFollowupForm as FollowupFormData,
  type PatientLabForm,
  type PatientImagingForm,
  type PatientVisitForm,
  type PatientNoteForm,
} from "@/drizzle/general-medical-history";
import { medicalRecordFormOpts, useAppForm } from "@/lib/tansack-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Suspense, useRef, useState, useTransition } from "react";
import LabsForm from "../../../components/patient-form/patient-labs";

// --- Helpers ---
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
  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanCompleted, setScanCompleted] = useState(false);
  const scanLock = useRef(false); // immutable flag — once true, no more scans this session
  const [activeTab, setActiveTab] = useState("details");
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const queryClient = useQueryClient();

  const createRecordMutation = useMutation({
    mutationFn: (data: medicalRecordForm) => createPatientRecord(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: (error) => {
      console.error("Error creating patient record:", error);
      setServerError("Failed to create patient record.");
    },
  });

  const form = useAppForm({
    ...medicalRecordFormOpts,
    onSubmit: async ({ value }) => {
      setServerError(null);
      setMissingFields([]);

      // Validate required fields (only names are required)
      const missing: string[] = [];
      if (!value.patient?.name?.trim()) missing.push("Full Name (English)");

      if (missing.length > 0) {
        setMissingFields(missing);
        setServerError(
          `Please fill in the required fields: ${missing.join(", ")}`,
        );
        setActiveTab("details");
        return;
      }

      startTransition(async () => {
        try {
          const parsed = medicalRecordFormSchema.partial().safeParse(value);
          if (!parsed.success) {
            const issueList = parsed.error.issues.map((issue) => {
              const path = issue.path.length ? issue.path.join(".") : "root";
              return `${path}: ${issue.message}`;
            });
            setServerError(`Validation error: ${issueList.join(" | ")}`);
            return;
          }
          console.log("Validated form data:", parsed.data);
          const result = await createRecordMutation.mutateAsync(
            parsed.data as medicalRecordForm,
          );
          if (!result?.success) {
            const fieldErrors = result?.fieldErrors ?? {};
            const issueList = Object.entries(fieldErrors).flatMap(
              ([path, messages]) =>
                (messages ?? []).map((msg) => `${path}: ${msg}`),
            );
            setServerError(
              issueList.length
                ? `Validation error: ${issueList.join(" | ")}`
                : result?.error || "Failed to create patient record.",
            );
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

  const readFileAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const handleScan = async (file: File) => {
    if (scanLock.current) {
      setScanError(
        "A scan has already been completed for this record. Save or discard to scan again.",
      );
      return;
    }
    setScanError(null);
    setServerError(null);
    setIsScanning(true);

    try {
      const fileData = await readFileAsBase64(file);
      const result = await streamMedicalRecordFromPayload({
        fileName: file.name,
        fileType: file.type,
        fileData,
      });

      // Convert AI string dates → Date objects for the form
      const toDate = (v: string | null | undefined): Date | null =>
        v ? new Date(v) : null;

      const patient = {
        ...result.patient,
        dob: toDate(result.patient.dob),
        first_visit_date: toDate(result.patient.first_visit_date),
      };

      const visits = result.patientVisits?.map((v) => ({
        ...v,
        visitDate: toDate(v.visitDate),
        nextAppointmentDate: toDate(v.nextAppointmentDate),
      }));

      const surgeries = result.patientSurgeries?.map((s) => ({
        ...s,
        surgeryDate: toDate(s.surgeryDate),
      }));

      const labs = result.patientLabs?.map((l) => ({
        ...l,
        labDate: toDate(l.labDate),
      }));

      const imaging = result.patientImaging?.map((i) => ({
        ...i,
        studyDate: toDate(i.studyDate),
      }));

      const followups = result.patientFollowups?.map((f) => ({
        ...f,
        callDate: toDate(f.callDate),
        scheduledVisitDate: toDate(f.scheduledVisitDate),
      }));

      const conditions = result.patientConditions?.map((c) => ({
        ...c,
        onsetDate: toDate(c.onsetDate),
      }));

      const medications = result.patientMedications?.map((m) => ({
        ...m,
        startDate: toDate(m.startDate),
        endDate: toDate(m.endDate),
      }));

      // Set each field individually so TanStack Form picks up changes
      form.setFieldValue("patient", patient as PatientForm);
      if (result.patientAllergies?.length)
        form.setFieldValue(
          "patientAllergies",
          result.patientAllergies as PatientAllergyForm[],
        );
      if (conditions?.length)
        form.setFieldValue(
          "patientConditions",
          conditions as PatientConditionForm[],
        );
      if (medications?.length)
        form.setFieldValue(
          "patientMedications",
          medications as PatientMedicationForm[],
        );
      if (result.patientSocialHistory?.length)
        form.setFieldValue(
          "patientSocialHistory",
          result.patientSocialHistory as PatientSocialHistoryForm[],
        );
      if (surgeries?.length)
        form.setFieldValue(
          "patientSurgeries",
          surgeries as PatientSurgeryForm[],
        );
      if (followups?.length)
        form.setFieldValue("patientFollowups", followups as FollowupFormData[]);
      if (labs?.length)
        form.setFieldValue("patientLabs", labs as PatientLabForm[]);
      if (imaging?.length)
        form.setFieldValue("patientImaging", imaging as PatientImagingForm[]);
      if (visits?.length)
        form.setFieldValue("patientVisits", visits as PatientVisitForm[]);
      if (result.patientNotes?.length)
        form.setFieldValue(
          "patientNotes",
          result.patientNotes as PatientNoteForm[],
        );

      // Lock scanning — only one successful scan per session
      scanLock.current = true;
      setScanCompleted(true);
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
            <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
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
                disabled={isScanning || scanCompleted}
              />
              {scanCompleted ? (
                <>
                  <ScanLine className="mr-2 h-4 w-4 text-green-600" /> Scanned ✓
                </>
              ) : isScanning ? (
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
            <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Extracting structured data...</span>
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
                          <div>
                            <Label
                              className={`text-xs font-semibold ${
                                missingFields.includes("Full Name (English)")
                                  ? "text-red-600"
                                  : "text-muted-foreground"
                              }`}
                            >
                              Full Name (English){" "}
                              <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              placeholder="Full Name (English)"
                              className={`text-lg font-bold h-10 ${
                                missingFields.includes("Full Name (English)")
                                  ? "border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500"
                                  : ""
                              }`}
                              value={field.state.value || ""}
                              onChange={(e) => {
                                field.handleChange(e.target.value);
                                if (e.target.value.trim()) {
                                  setMissingFields((prev) =>
                                    prev.filter(
                                      (f) => f !== "Full Name (English)",
                                    ),
                                  );
                                  if (missingFields.length <= 1)
                                    setServerError(null);
                                }
                              }}
                              required
                            />
                          </div>
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

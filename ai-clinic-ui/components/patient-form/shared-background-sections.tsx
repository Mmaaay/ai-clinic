"use client";

import React from "react";
import {
  AlertCircle,
  Activity,
  Pill,
  Stethoscope,
  Coffee,
  Plus,
  Trash2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type IdValue = string | number;
type DateValue = Date | string | number | null | undefined;
type RegisterFn = (name: string) => Record<string, unknown>;
type RenderFieldFn = (
  index: number,
  fieldName: string,
  type?: string,
) => React.ReactNode;

interface AllergyItem {
  id?: IdValue;
  allergen?: string | null;
  severity?: string | null;
  createdAt?: DateValue;
}

interface ConditionItem {
  id?: IdValue;
  conditionName?: string | null;
  conditionStatus?: string | null;
  notes?: string | null;
  createdAt?: DateValue;
}

interface MedicationItem {
  id?: IdValue;
  drugName?: string | null;
  dosage?: string | null;
  frequency?: string | null;
  createdAt?: DateValue;
}

interface SurgeryItem {
  id?: IdValue;
  procedureName?: string | null;
  procedureType?: string | null;
  surgeryDate?: DateValue;
  hospitalName?: string | null;
  surgeonName?: string | null;
  firstAssistant?: string | null;
  secondAssistant?: string | null;
  dissectionBy?: string | null;
  cameraMan?: string | null;
  operativeNotes?: string | null;
  summaryNotes?: string | null;
}

interface SocialHistoryItem {
  id?: IdValue;
  category?: string | null;
  value?: string | null;
}

// ============= ALLERGIES SECTION =============
interface AllergiesProps {
  fields: AllergyItem[];
  isEditing: boolean;
  onAdd?: () => void;
  onRemove?: (index: number) => void;
  register?: RegisterFn; // For React Hook Form
  renderField?: RenderFieldFn;
  getSeverityColor?: (severity: string | null) => string;
  displayDate?: (date: DateValue) => string;
}

export function AllergiesSection({
  fields,
  isEditing,
  onAdd,
  onRemove,
  register,
  renderField,
  getSeverityColor,
  displayDate,
}: AllergiesProps) {
  const defaultSeverityColor = (severity: string | null) => {
    const s = severity?.toLowerCase();
    if (s === "severe" || s === "life threatening")
      return "bg-destructive text-white";
    if (s === "moderate") return "bg-orange-500 text-white";
    if (s === "mild") return "bg-green-600 text-white";
    return "bg-slate-500 text-white";
  };

  const colorFn = getSeverityColor || defaultSeverityColor;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <CardTitle className="text-base">Allergies</CardTitle>
        </div>
        {isEditing && onAdd && (
          <Button type="button" variant="outline" size="sm" onClick={onAdd}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground italic">
            No allergies recorded.
          </p>
        )}

        {isEditing
          ? fields.map((field, index) => (
              <div
                key={field.id || index}
                className="flex flex-col gap-2 bg-card p-3 border rounded-lg shadow-sm"
              >
                <div className="flex flex-col sm:flex-row gap-2 items-start">
                  {renderField && displayDate && (
                    <div className="w-full sm:w-32">
                      {renderField(index, "createdAt", "date")}
                    </div>
                  )}

                  <div className="flex-1 w-full">
                    {register ? (
                      <Input
                        {...register(`patientAllergies.${index}.allergen`)}
                        placeholder="Allergen (e.g. Peanuts)"
                        className="h-9"
                      />
                    ) : renderField ? (
                      renderField(index, "allergen")
                    ) : null}
                  </div>

                  <div className="w-full sm:w-40">
                    {register ? (
                      <select
                        {...register(`patientAllergies.${index}.severity`)}
                        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="Mild">Mild</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Severe">Severe</option>
                        <option value="Life Threatening">
                          Life Threatening
                        </option>
                      </select>
                    ) : renderField ? (
                      renderField(index, "severity")
                    ) : null}
                  </div>

                  {onRemove && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemove(index)}
                      className="text-destructive h-9 w-9"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          : fields.map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-3 rounded-lg border border-l-4 border-l-destructive bg-card"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{item.allergen}</span>
                  {displayDate && item.createdAt && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {displayDate(item.createdAt)}
                    </span>
                  )}
                </div>
                <Badge className={colorFn(item.severity!)}>
                  {item.severity}
                </Badge>
              </div>
            ))}
      </CardContent>
    </Card>
  );
}

// ============= CONDITIONS SECTION =============
interface ConditionsProps {
  fields: ConditionItem[];
  isEditing: boolean;
  onAdd?: () => void;
  onRemove?: (index: number) => void;
  register?: RegisterFn;
  renderField?: RenderFieldFn;
  displayDate?: (date: DateValue) => string;
}

export function ConditionsSection({
  fields,
  isEditing,
  onAdd,
  onRemove,
  register,
  renderField,
  displayDate,
}: ConditionsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          <CardTitle className="text-base">Medical Conditions</CardTitle>
        </div>
        {isEditing && onAdd && (
          <Button type="button" variant="outline" size="sm" onClick={onAdd}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground italic">
            No conditions recorded.
          </p>
        )}

        {isEditing
          ? fields.map((field, index) => (
              <div
                key={field.id || index}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 border p-3 rounded-lg relative bg-muted/20"
              >
                <div className="absolute top-2 right-2 sm:static sm:col-span-1 sm:flex sm:items-center sm:justify-center">
                  {onRemove && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-500 h-8 w-8"
                      onClick={() => onRemove(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {renderField && displayDate && (
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Date
                    </label>
                    {renderField(index, "createdAt", "date")}
                  </div>
                )}

                <div className="sm:col-span-4 space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Condition
                  </label>
                  {register ? (
                    <Input
                      {...register(`patientConditions.${index}.conditionName`)}
                      placeholder="e.g. Hypertension"
                    />
                  ) : renderField ? (
                    renderField(index, "conditionName")
                  ) : null}
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Status
                  </label>
                  {register ? (
                    <select
                      {...register(
                        `patientConditions.${index}.conditionStatus`,
                      )}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="Active">Active</option>
                      <option value="Remission">Remission</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  ) : renderField ? (
                    renderField(index, "conditionStatus")
                  ) : null}
                </div>

                <div className="sm:col-span-3 space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Notes
                  </label>
                  {register ? (
                    <Input
                      {...register(`patientConditions.${index}.notes`)}
                      placeholder="Details..."
                    />
                  ) : renderField ? (
                    renderField(index, "notes")
                  ) : null}
                </div>
              </div>
            ))
          : fields.map((c, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-3 border rounded-lg border-l-4 border-l-blue-500 bg-card"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-sm">{c.conditionName}</span>
                  {displayDate && c.createdAt && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {displayDate(c.createdAt)}
                    </span>
                  )}
                </div>
                <Badge variant="outline">{c.conditionStatus}</Badge>
              </div>
            ))}
      </CardContent>
    </Card>
  );
}

// ============= MEDICATIONS SECTION =============
interface MedicationsProps {
  fields: MedicationItem[];
  isEditing: boolean;
  onAdd?: () => void;
  onRemove?: (index: number) => void;
  register?: RegisterFn;
  renderField?: RenderFieldFn;
  displayDate?: (date: DateValue) => string;
}

export function MedicationsSection({
  fields,
  isEditing,
  onAdd,
  onRemove,
  register,
  renderField,
  displayDate,
}: MedicationsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Pill className="w-5 h-5 text-emerald-500" />
          <CardTitle className="text-base">Medications</CardTitle>
        </div>
        {isEditing && onAdd && (
          <Button type="button" variant="outline" size="sm" onClick={onAdd}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground italic">
            No medications recorded.
          </p>
        )}

        {isEditing ? (
          fields.map((field, index) => (
            <div
              key={field.id || index}
              className="flex flex-col gap-2 p-3 border rounded-lg bg-card"
            >
              <div className="flex flex-col sm:flex-row gap-2 items-start">
                {renderField && displayDate && (
                  <div className="w-full sm:w-32">
                    {renderField(index, "createdAt", "date")}
                  </div>
                )}

                <div className="flex-1">
                  {register ? (
                    <Input
                      {...register(`patientMedications.${index}.drugName`)}
                      placeholder="Drug Name"
                      className="h-9"
                    />
                  ) : renderField ? (
                    renderField(index, "drugName")
                  ) : null}
                </div>

                <div className="w-full sm:w-32">
                  {register ? (
                    <Input
                      {...register(`patientMedications.${index}.dosage`)}
                      placeholder="Dosage"
                      className="h-9"
                    />
                  ) : renderField ? (
                    renderField(index, "dosage")
                  ) : null}
                </div>

                {register && (
                  <div className="w-full sm:w-32">
                    <Input
                      {...register(`patientMedications.${index}.frequency`)}
                      placeholder="Frequency"
                      className="h-9"
                    />
                  </div>
                )}

                {onRemove && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive h-9 w-9"
                    onClick={() => onRemove(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fields.map((m, i) => (
              <Card
                key={i}
                className="shadow-none border-l-4 border-l-emerald-500"
              >
                <CardContent className="p-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold">{m.drugName}</p>
                    <p className="text-xs text-muted-foreground mb-1">
                      {m.dosage} {m.frequency && `— ${m.frequency}`}
                    </p>
                    {displayDate && m.createdAt && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-muted/50 w-fit px-1 rounded">
                        <Calendar className="w-3 h-3" />
                        {displayDate(m.createdAt)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============= SURGERIES SECTION =============
interface SurgeriesProps {
  fields: SurgeryItem[];
  isEditing: boolean;
  onAdd?: () => void;
  onRemove?: (index: number) => void;
  register?: RegisterFn;
  renderField?: RenderFieldFn;
  displayDate?: (date: DateValue) => string;
  onSurgeryClick?: (surgery: SurgeryItem) => void;
}

export function SurgeriesSection({
  fields,
  isEditing,
  onAdd,
  onRemove,
  register,
  renderField,
  displayDate,
  onSurgeryClick,
}: SurgeriesProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-amber-600" />
          <CardTitle className="text-base">Surgical History</CardTitle>
        </div>
        {isEditing && onAdd && (
          <Button type="button" variant="outline" size="sm" onClick={onAdd}>
            <Plus className="w-4 h-4 mr-1" /> Add Surgery
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground italic">
            No surgeries recorded.
          </p>
        )}

        {isEditing
          ? fields.map((field, index) => (
              <div
                key={field.id || index}
                className="relative p-5 border rounded-xl bg-card shadow-sm group"
              >
                {onRemove && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-3 right-3 h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                    onClick={() => onRemove(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}

                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        Procedure Name
                      </label>
                      {register ? (
                        <Input
                          {...register(
                            `patientSurgeries.${index}.procedureName`,
                          )}
                          placeholder="e.g., Lap Cholecystectomy"
                        />
                      ) : renderField ? (
                        renderField(index, "procedureName")
                      ) : null}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        Procedure Type
                      </label>
                      {register ? (
                        <select
                          {...register(
                            `patientSurgeries.${index}.procedureType`,
                          )}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          <option value="Sleeve Gastrectomy">
                            Sleeve Gastrectomy
                          </option>
                          <option value="Gastric Bypass (RNY)">
                            Gastric Bypass (RNY)
                          </option>
                          <option value="Mini Gastric Bypass (MGB)">
                            Mini Gastric Bypass (MGB)
                          </option>
                          <option value="SASI">SASI</option>
                          <option value="Gastric Balloon">
                            Gastric Balloon
                          </option>
                          <option value="Revisional Surgery">
                            Revisional Surgery
                          </option>
                          <option value="Other">Other</option>
                        </select>
                      ) : renderField ? (
                        renderField(index, "procedureType")
                      ) : null}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Surgery Date
                      </label>
                      {register ? (
                        <Input
                          type="date"
                          {...register(`patientSurgeries.${index}.surgeryDate`)}
                        />
                      ) : renderField ? (
                        renderField(index, "surgeryDate", "date")
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        Hospital Name
                      </label>
                      {register ? (
                        <Input
                          {...register(
                            `patientSurgeries.${index}.hospitalName`,
                          )}
                          placeholder="Hospital or clinic name"
                        />
                      ) : renderField ? (
                        renderField(index, "hospitalName")
                      ) : null}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        Surgeon Name
                      </label>
                      {register ? (
                        <Input
                          {...register(`patientSurgeries.${index}.surgeonName`)}
                          placeholder="Dr. Surgeon Name"
                        />
                      ) : renderField ? (
                        renderField(index, "surgeonName")
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        First Assistant
                      </label>
                      {register ? (
                        <Input
                          {...register(
                            `patientSurgeries.${index}.firstAssistant`,
                          )}
                          placeholder="Assistant name"
                        />
                      ) : renderField ? (
                        renderField(index, "firstAssistant")
                      ) : null}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        Second Assistant
                      </label>
                      {register ? (
                        <Input
                          {...register(
                            `patientSurgeries.${index}.secondAssistant`,
                          )}
                          placeholder="Assistant name"
                        />
                      ) : renderField ? (
                        renderField(index, "secondAssistant")
                      ) : null}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        Dissection By
                      </label>
                      {register ? (
                        <Input
                          {...register(
                            `patientSurgeries.${index}.dissectionBy`,
                          )}
                          placeholder="Person who performed dissection"
                        />
                      ) : renderField ? (
                        renderField(index, "dissectionBy")
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      Camera Man
                    </label>
                    {register ? (
                      <Input
                        {...register(`patientSurgeries.${index}.cameraMan`)}
                        placeholder="Person handling camera"
                      />
                    ) : renderField ? (
                      renderField(index, "cameraMan")
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        Operative Notes
                      </label>
                      {register ? (
                        <textarea
                          {...register(
                            `patientSurgeries.${index}.operativeNotes`,
                          )}
                          rows={4}
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                          placeholder="Detailed operative report..."
                        />
                      ) : renderField ? (
                        renderField(index, "operativeNotes", "textarea")
                      ) : null}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        Summary Notes
                      </label>
                      {register ? (
                        <textarea
                          {...register(
                            `patientSurgeries.${index}.summaryNotes`,
                          )}
                          rows={4}
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                          placeholder="Brief summary for quick reference..."
                        />
                      ) : renderField ? (
                        renderField(index, "summaryNotes", "textarea")
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ))
          : fields.map((s, i) => (
              <div
                key={i}
                onClick={() => onSurgeryClick && onSurgeryClick(s)}
                className={`flex items-center justify-between p-3 border rounded-lg bg-card ${onSurgeryClick ? "hover:bg-muted/50 cursor-pointer" : ""} transition-colors`}
              >
                <div>
                  <p className="text-sm font-bold uppercase">
                    {s.procedureType || s.procedureName}
                  </p>
                  {s.procedureName && s.procedureType && (
                    <p className="text-xs text-muted-foreground">
                      {s.procedureName}
                    </p>
                  )}
                  {displayDate && s.surgeryDate && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      {displayDate(s.surgeryDate)}
                    </span>
                  )}
                </div>
              </div>
            ))}
      </CardContent>
    </Card>
  );
}

// ============= SOCIAL HISTORY SECTION =============
interface SocialHistoryProps {
  fields: SocialHistoryItem[];
  isEditing: boolean;
  onAdd?: () => void;
  onRemove?: (index: number) => void;
  register?: RegisterFn;
  renderField?: RenderFieldFn;
}

export function SocialHistorySection({
  fields,
  isEditing,
  onAdd,
  onRemove,
  register,
  renderField,
}: SocialHistoryProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Coffee className="w-5 h-5 text-purple-600" />
          <CardTitle className="text-base">Social History</CardTitle>
        </div>
        {isEditing && onAdd && (
          <Button type="button" variant="outline" size="sm" onClick={onAdd}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground italic">
            No social history recorded.
          </p>
        )}

        {fields.map((field, index) => (
          <div
            key={field.id || index}
            className="flex flex-col sm:flex-row gap-3 items-start sm:items-end"
          >
            <div className="w-full sm:w-1/3 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Category
              </label>
              {register ? (
                <select
                  {...register(`patientSocialHistory.${index}.category`)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="Smoking">Smoking</option>
                  <option value="Alcohol">Alcohol</option>
                  <option value="Diet">Diet</option>
                  <option value="Exercise">Exercise</option>
                  <option value="Occupation">Occupation</option>
                </select>
              ) : renderField ? (
                renderField(index, "category")
              ) : null}
            </div>

            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Status / Details
              </label>
              {register ? (
                <Input
                  {...register(`patientSocialHistory.${index}.value`)}
                  placeholder="e.g. 1 pack/day"
                />
              ) : renderField ? (
                renderField(index, "value")
              ) : null}
            </div>

            {onRemove && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-red-500 mb-0.5"
                onClick={() => onRemove(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

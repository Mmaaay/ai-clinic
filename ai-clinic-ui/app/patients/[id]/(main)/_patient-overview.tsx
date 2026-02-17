"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Patients,
  patientStatusEnumType,
} from "@/drizzle/schemas/patient_patients";
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { getPatientById } from "@/lib/server/patient-by-id";
import { updatePatientRecord } from "@/actions/patient-actions/medical-record-actions";

export default function PatientOverview({ id }: { id: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const { data: patientDataFromQuery } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => getPatientById({ patientId: id }),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const form = useForm({
    defaultValues: patientDataFromQuery as Patients | undefined,
    onSubmit: async ({ value }) => {
      const result = await updatePatientRecord({
        patientId: id,
        data: { patient: value },
      });

      if (result.success) {
        setIsEditing(false);
      }
    },
  });

  useEffect(() => {
    if (patientDataFromQuery) {
      form.reset(patientDataFromQuery);
    }
  }, [patientDataFromQuery, form]);

  return (
    <form
      id="patient-overview-form"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
        <div className="text-xs sm:text-sm text-muted-foreground">
          Update patient demographics and contact details.
        </div>
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          {isEditing ? (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (patientDataFromQuery) {
                    form.reset(patientDataFromQuery as Patients);
                  }
                  setIsEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          )}
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 p-4 sm:p-6">
          <form.Field name="name">
            {(field) => (
              <div className="space-y-1">
                <label className="text-sm font-medium">Name *</label>
                <Input
                  placeholder="Patient name"
                  disabled={!isEditing}
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  required
                />
              </div>
            )}
          </form.Field>

          <form.Field name="nameAr">
            {(field) => (
              <div className="space-y-1">
                <label className="text-sm font-medium">Arabic Name</label>
                <Input
                  placeholder="اسم المريض"
                  dir="rtl"
                  disabled={!isEditing}
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="nationalId">
            {(field) => (
              <div className="space-y-1">
                <label className="text-sm font-medium">National ID</label>
                <Input
                  placeholder="National ID number"
                  disabled={!isEditing}
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="age">
            {(field) => (
              <div className="space-y-1">
                <label className="text-sm font-medium">Age</label>
                <Input
                  type="number"
                  placeholder="Age"
                  disabled={!isEditing}
                  value={field.state.value ?? ""}
                  onChange={(e) =>
                    field.handleChange(
                      e.target.value ? parseInt(e.target.value, 10) : null,
                    )
                  }
                />
              </div>
            )}
          </form.Field>

          <form.Field name="gender">
            {(field) => (
              <div className="space-y-1">
                <label className="text-sm font-medium">Gender</label>
                <Select
                  onValueChange={field.handleChange}
                  value={field.state.value ?? undefined}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          <form.Field name="dob">
            {(field) => (
              <div className="space-y-1">
                <label className="text-sm font-medium">Date of Birth</label>
                <Input
                  type="datetime-local"
                  disabled={!isEditing}
                  value={
                    field.state.value
                      ? new Date(field.state.value).toISOString().slice(0, 16)
                      : ""
                  }
                  onChange={(e) =>
                    field.handleChange(
                      e.target.value ? new Date(e.target.value) : null,
                    )
                  }
                />
              </div>
            )}
          </form.Field>

          <form.Field name="phone">
            {(field) => (
              <div className="space-y-1">
                <label className="text-sm font-medium">Phone</label>
                <Input
                  type="tel"
                  placeholder="Phone number"
                  disabled={!isEditing}
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="optional_phone">
            {(field) => (
              <div className="space-y-1">
                <label className="text-sm font-medium">Optional Phone</label>
                <Input
                  type="tel"
                  placeholder="Optional phone number"
                  disabled={!isEditing}
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="height">
            {(field) => (
              <div className="space-y-1">
                <label className="text-sm font-medium">Height (cm)</label>
                <Input
                  type="number"
                  placeholder="Height in cm"
                  disabled={!isEditing}
                  value={field.state.value ?? ""}
                  onChange={(e) =>
                    field.handleChange(
                      e.target.value ? parseInt(e.target.value, 10) : null,
                    )
                  }
                />
              </div>
            )}
          </form.Field>

          <form.Field name="initial_weight">
            {(field) => (
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  Initial Weight (kg)
                </label>
                <Input
                  type="number"
                  placeholder="Initial weight in kg"
                  disabled={!isEditing}
                  value={field.state.value ?? ""}
                  onChange={(e) =>
                    field.handleChange(
                      e.target.value ? parseInt(e.target.value, 10) : null,
                    )
                  }
                />
              </div>
            )}
          </form.Field>

          <form.Field name="initial_bmi">
            {(field) => (
              <div className="space-y-1">
                <label className="text-sm font-medium">Initial BMI</label>
                <Input
                  type="number"
                  placeholder="Initial BMI"
                  disabled={!isEditing}
                  value={field.state.value ?? ""}
                  onChange={(e) =>
                    field.handleChange(
                      e.target.value ? parseInt(e.target.value, 10) : null,
                    )
                  }
                />
              </div>
            )}
          </form.Field>

          <form.Field name="clinic_address">
            {(field) => (
              <div className="space-y-1 sm:col-span-2">
                <label className="text-sm font-medium">Clinic Address</label>
                <Input
                  placeholder="Clinic address"
                  disabled={!isEditing}
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="residency">
            {(field) => (
              <div className="space-y-1 sm:col-span-2">
                <label className="text-sm font-medium">Residency</label>
                <Input
                  placeholder="Patient residency"
                  disabled={!isEditing}
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="referral">
            {(field) => (
              <div className="space-y-1 sm:col-span-2">
                <label className="text-sm font-medium">Referral</label>
                <Input
                  placeholder="Referral information"
                  disabled={!isEditing}
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="call_center_agent">
            {(field) => (
              <div className="space-y-1 sm:col-span-2">
                <label className="text-sm font-medium">Call Center Agent</label>
                <Input
                  placeholder="Call center agent name"
                  disabled={!isEditing}
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="status">
            {(field) => (
              <div className="space-y-1">
                <label className="text-sm font-medium">Status</label>
                <Select
                  onValueChange={
                    field.handleChange as (value: patientStatusEnumType) => void
                  }
                  value={field.state.value ?? undefined}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Complicated">Complicated</SelectItem>
                    <SelectItem value="Deceased">Deceased</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          <form.Field name="first_visit_date">
            {(field) => (
              <div className="space-y-1">
                <label className="text-sm font-medium">First Visit Date</label>
                <Input
                  type="datetime-local"
                  disabled={!isEditing}
                  value={
                    field.state.value
                      ? new Date(field.state.value).toISOString().slice(0, 16)
                      : ""
                  }
                  onChange={(e) =>
                    field.handleChange(
                      e.target.value ? new Date(e.target.value) : null,
                    )
                  }
                />
              </div>
            )}
          </form.Field>
        </CardContent>
      </Card>
    </form>
  );
}

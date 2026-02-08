"use client";

import React from "react";
import { Calendar, Stethoscope } from "lucide-react";
import { useRouter } from "next/navigation";
import { PatientSurgery } from "@/drizzle/schemas/patient_surgeries";

interface SurgeriesSectionProps {
  patientId: string;
  surgeries: PatientSurgery[];
  displayDate: (date: Date | string | null | undefined) => string;
}

export default function SurgeriesSection({
  patientId,
  surgeries,
  displayDate,
}: SurgeriesSectionProps) {
  const router = useRouter();

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Stethoscope className="w-5 h-5 text-blue-500" />
        <h2 className="text-md font-bold uppercase tracking-wider text-muted-foreground">
          Past Surgeries
        </h2>
      </div>
      <div className="space-y-2">
        {surgeries.map((s, i) => (
          <div
            key={i}
            onClick={() =>
              router.push(`/patients/${patientId}/surgery?surgeryId=${s.id}`)
            }
            className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/50 cursor-pointer transition-colors"
          >
            <div>
              <p className="text-sm font-bold uppercase">{s.procedureType}</p>
              <p className="text-xs text-muted-foreground">{s.procedureName}</p>
              {/* Date for Surgery */}
              <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                <Calendar className="w-3 h-3" />
                {displayDate(s.surgeryDate)}
              </span>
            </div>
          </div>
        ))}
        {surgeries.length === 0 && (
          <p className="text-sm text-muted-foreground italic">
            No surgeries recorded.
          </p>
        )}
      </div>
    </section>
  );
}

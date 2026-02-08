"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { VitalsSnapshot } from "./types";
import { formatDate } from "./utils";

export function PatientDiagnosisTable({
  vitals,
  patientId,
  onBack,
}: {
  vitals?: VitalsSnapshot | null;
  patientId: string | null;
  onBack: () => void;
}) {
  const router = useRouter();

  const handleViewPatient = () => {
    if (patientId) {
      router.push(`/patients/${patientId}`);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-white/80 p-5 shadow-sm dark:bg-neutral-900/70">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Vitals
          </p>
          <h3 className="text-lg">Vitals snapshot</h3>
          <p className="text-sm text-muted-foreground">
            BP, heart rate, temperature, and SpO2 for the selected patient.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {patientId ? (
            <Button variant="outline" size="sm" onClick={handleViewPatient}>
              View Full Record
            </Button>
          ) : null}
          <button
            type="button"
            className="rounded-md border border-border bg-white px-3 py-1 text-xs font-medium shadow-sm transition-colors hover:bg-muted dark:bg-neutral-900"
            onClick={onBack}
          >
            Back
          </button>
        </div>
      </div>

      {vitals ? (
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Blood pressure</TableHead>
              <TableHead>Heart rate</TableHead>
              <TableHead>Temperature</TableHead>
              <TableHead>SpO2</TableHead>
              <TableHead>Recorded</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>{vitals.bp ?? "N/A"}</TableCell>
              <TableCell>{vitals.hr ?? "N/A"}</TableCell>
              <TableCell>{vitals.temp ?? "N/A"}</TableCell>
              <TableCell>{vitals.spo2 ?? "N/A"}</TableCell>
              <TableCell className="text-muted-foreground">
                {vitals.createdAt ? formatDate(vitals.createdAt) : "N/A"}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      ) : (
        <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          Select a patient above to view vitals details.
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  backgroundDataExists,
  type backGroundDataReturnType,
  exportPatientPdf,
} from "@/actions/patient-actions/export-actionts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ExportOption = {
  id: string;
  label: string;
  color: string;
  existsKey: keyof backGroundDataReturnType;
};

type ExportSectionId =
  | "overview"
  | "background"
  | "surgery"
  | "followUp"
  | "imaging"
  | "labs"
  | "notes"
  | "visits"
  | "bmi";

const exportOptions: ExportOption[] = [
  {
    id: "overview",
    label: "Overview",
    color: "#3b82f6",
    existsKey: "overview",
  },
  {
    id: "background",
    label: "Background",
    color: "#ec4899",
    existsKey: "background",
  },
  { id: "surgery", label: "Surgery", color: "#8b5cf6", existsKey: "surgery" },
  {
    id: "followUp",
    label: "Follow-Up",
    color: "#10b981",
    existsKey: "followUp",
  },
  { id: "imaging", label: "Imaging", color: "#f59e0b", existsKey: "imaging" },
  { id: "labs", label: "Labs", color: "#ef4444", existsKey: "labs" },
  { id: "notes", label: "Notes", color: "#6366f1", existsKey: "notes" },
  { id: "visits", label: "Visits", color: "#14b8a6", existsKey: "visits" },
];

export function ExportModal({ patientId }: { patientId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataExists, setDataExists] = useState<backGroundDataReturnType | null>(
    null,
  );
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isOpen || typeof patientId !== "string" || patientId.length === 0) {
      return;
    }

    let isActive = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await backgroundDataExists(patientId);
        if (isActive) {
          setDataExists(result);
          setSelected({});
        }
      } catch {
        if (isActive) {
          setError("Failed to load export options.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      isActive = false;
    };
  }, [isOpen, patientId]);

  const availableOptions = useMemo(() => {
    if (!dataExists) {
      return [] as ExportOption[];
    }

    const baseOptions = exportOptions.filter(
      (option) => dataExists[option.existsKey],
    );

    if (dataExists.visits) {
      baseOptions.push({
        id: "bmi",
        label: "BMI",
        color: "#0ea5e9",
        existsKey: "visits",
      });
    }

    return baseOptions;
  }, [dataExists]);

  const selectedIds = useMemo(
    () =>
      availableOptions
        .filter((option) => selected[option.id])
        .map((option) => option.id),
    [availableOptions, selected],
  );

  const toggleSelection = (optionId: string) => {
    setSelected((prev) => ({
      ...prev,
      [optionId]: !prev[optionId],
    }));
  };

  const handleExport = async () => {
    if (selectedIds.length === 0) return;
    setIsExporting(true);
    setError(null);
    try {
      const result = await exportPatientPdf({
        patientId,
        sections: selectedIds as ExportSectionId[],
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      const binary = Uint8Array.from(atob(result.base64), (char) =>
        char.charCodeAt(0),
      );
      const blob = new Blob([binary], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setIsOpen(false);
    } catch {
      setError("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Export</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export patient data</DialogTitle>
          <DialogDescription>
            Select the sections you want to include in the export.
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="text-sm text-muted-foreground">
            Loading export options...
          </div>
        )}

        {!isLoading && error && (
          <div className="text-sm text-destructive">{error}</div>
        )}

        {!isLoading &&
          !error &&
          dataExists &&
          availableOptions.length === 0 && (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No exportable data found for this patient yet.
            </div>
          )}

        {!isLoading && !error && dataExists && availableOptions.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {availableOptions.map((option) => {
              const isSelected = Boolean(selected[option.id]);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleSelection(option.id)}
                  className={cn(
                    "flex w-full flex-col items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-all",
                    isSelected
                      ? "text-white shadow-lg"
                      : "text-foreground hover:border-muted-foreground/50",
                  )}
                  style={
                    isSelected
                      ? {
                          backgroundColor: option.color,
                          borderColor: option.color,
                          boxShadow: `0 4px 12px ${option.color}55`,
                        }
                      : {
                          borderColor: `${option.color}55`,
                        }
                  }
                  aria-pressed={isSelected}
                >
                  <span className="text-[11px] uppercase tracking-wide opacity-80">
                    {option.label}
                  </span>
                  <span className="text-sm">
                    {isSelected ? "Selected" : "Tap to select"}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            type="button"
            disabled={selectedIds.length === 0 || isExporting}
            onClick={handleExport}
          >
            {isExporting ? "Building PDF..." : `Export (${selectedIds.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

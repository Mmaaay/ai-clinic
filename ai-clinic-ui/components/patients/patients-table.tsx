"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import { PatientListTable } from "./patient-list-table";
import { Patients } from "@/drizzle/schemas/patient_patients";

const columns: ColumnDef<Patients>[] = [
  { accessorKey: "name", header: "Name" },
  {
    accessorKey: "nationalId",
    header: "National ID",
    cell: ({ row }) => row.original.nationalId ?? "—",
  },
  {
    accessorKey: "age",
    header: "Age",
    cell: ({ row }) => row.original.age ?? "—",
  },
  {
    accessorKey: "createdAt",
    header: "Visit Date",
    cell: ({ row }) =>
      new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeZone: "UTC",
      }).format(new Date(row.original.updatedAt)),
  },
];

interface PatientsTableProps {
  patients: Patients[];
}

export function PatientsTable({ patients }: PatientsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "name", desc: false },
  ]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pageIndex, setPageIndex] = useState(0);

  const { isLoading, isError } = useQuery({
    queryKey: ["patients"],
    queryFn: () => {
      throw new Error("Patients should be prefetched on server");
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: true,
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: patients,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination: { pageIndex, pageSize: 5 },
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({ pageIndex, pageSize: 5 })
          : updater;
      setPageIndex(next.pageIndex ?? 0);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: "includesString",
  });

  return (
    <div className="relative mt-6 overflow-hidden">
      <div className="flex transition-transform duration-300 ease-in-out">
        <div className="w-full shrink-0 basis-full pr-3">
          <PatientListTable
            table={table}
            loading={isLoading}
            isError={isError}
            globalFilter={globalFilter}
            onGlobalFilterChange={setGlobalFilter}
          />
        </div>
      </div>
    </div>
  );
}

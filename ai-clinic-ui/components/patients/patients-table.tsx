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
    meta: { className: "hidden sm:table-cell" },
  },
  {
    accessorKey: "age",
    header: "Age",
    cell: ({ row }) => row.original.age ?? "—",
  },
  {
    accessorKey: "createdAt",
    header: "Added",
    cell: ({ row }) =>
      new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeZone: "UTC",
      }).format(new Date(row.original.createdAt)),
    meta: { className: "hidden md:table-cell" },
  },
];

interface PatientsTableProps {
  patients: Patients[];
}

export function PatientsTable({ patients }: PatientsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pageIndex, setPageIndex] = useState(0);

  const { data, isLoading, isError } = useQuery<Patients[]>({
    queryKey: ["patients"],
    queryFn: async () => {
      const res = await fetch("/api/patients");
      if (!res.ok) throw new Error("Failed to fetch patients");
      return res.json();
    },
    initialData: patients,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: data ?? patients,
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

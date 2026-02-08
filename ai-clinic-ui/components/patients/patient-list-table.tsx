"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Patients } from "@/drizzle/schemas/patient_patients";
import { flexRender, Table as TanTable } from "@tanstack/react-table";
import { useRouter } from "next/navigation";

export function PatientListTable({
  table,
  loading,
  isError,
  globalFilter,
  onGlobalFilterChange,
}: {
  table: TanTable<Patients>;
  loading: boolean;
  isError: boolean;
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
}) {
  const router = useRouter();
  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
        <input
          className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          placeholder="Search patients by name or phone"
          value={globalFilter ?? ""}
          onChange={(e) => onGlobalFilterChange(e.target.value)}
        />
        <div className="text-xs text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} /{" "}
          {Math.max(table.getPageCount(), 1)}
        </div>
      </div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-muted/50">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  style={{ width: header.column.getSize() }}
                  className="cursor-pointer select-none"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                  {header.column.getIsSorted() === "asc" && " ▲"}
                  {header.column.getIsSorted() === "desc" && " ▼"}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                Loading patients…
              </TableCell>
            </TableRow>
          ) : isError ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="py-10 text-center text-sm text-destructive"
              >
                {"Unable to load patients."}
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer select-none transition-colors hover:bg-muted/40 "
                onClick={() => {
                  router.push(`/patients/${row.original.id}`);
                }}
                role="link"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(`/patients/${row.original.id}`);
                  }
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="select-none">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={5}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                No patients yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between border-t border-border/70 px-4 py-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 select-none">
          <button
            type="button"
            className="cursor-pointer select-none rounded-md border border-border/70 px-3 py-1 text-xs font-medium disabled:opacity-50"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Prev
          </button>
          <button
            type="button"
            className="cursor-pointer select-none rounded-md border border-border/70 px-3 py-1 text-xs font-medium disabled:opacity-50"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </button>
        </div>
        <span className="select-none">
          Showing {table.getRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} rows
        </span>
      </div>
    </div>
  );
}

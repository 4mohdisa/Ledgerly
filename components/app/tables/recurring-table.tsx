"use client"

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "../../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";

const recurringData = [
  { id: "1", name: "Rent", frequency: "Monthly", nextOccurrence: "2025-02-01" },
  { id: "2", name: "Gym", frequency: "Weekly", nextOccurrence: "2025-01-10" },
  { id: "3", name: "Subscription", frequency: "Annually", nextOccurrence: "2025-12-01" },
];

export const columns: ColumnDef<typeof recurringData[0]>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <div>{row.getValue("name")}</div>,
  },
  {
    accessorKey: "frequency",
    header: "Frequency",
    cell: ({ row }) => <div>{row.getValue("frequency")}</div>,
  },
  {
    accessorKey: "nextOccurrence",
    header: "Next Occurrence",
    cell: ({ row }) => <div>{row.getValue("nextOccurrence")}</div>,
  },
];

export function RecurringTable() {
  const table = useReactTable({
    data: recurringData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="w-full">
      <h2>Recurring Transactions</h2>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

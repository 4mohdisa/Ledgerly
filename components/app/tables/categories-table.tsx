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

const categoriesData = [
  { id: "1", name: "Food", icon: "", color: "#FF0000", usage: 10 },
  { id: "2", name: "Transport", icon: "", color: "#00FF00", usage: 5 },
  { id: "3", name: "Utilities", icon: "", color: "#0000FF", usage: 8 },
];

export const columns: ColumnDef<typeof categoriesData[0]>[] = [
  {
    accessorKey: "name",
    header: "Category Name",
    cell: ({ row }) => <div>{row.getValue("name")}</div>,
  },
  {
    accessorKey: "icon",
    header: "Icon",
    cell: ({ row }) => <div>{row.getValue("icon")}</div>,
  },
  {
    accessorKey: "color",
    header: "Color",
    cell: ({ row }) => <div style={{ backgroundColor: row.getValue("color") }} className="w-4 h-4 rounded-full"></div>,
  },
  {
    accessorKey: "usage",
    header: "Usage",
    cell: ({ row }) => <div>{row.getValue("usage")}</div>,
  },
];

export function CategoriesTable() {
  const table = useReactTable({
    data: categoriesData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="w-full">
      <h2>Categories</h2>
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

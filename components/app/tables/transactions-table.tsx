"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal } from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

import { transactions } from "@/data/transactions"
import { categories } from "@/data/categories"
import { ConfirmationDialog } from "../confirmation-dialog"
import { TransactionDialog } from "../transaction-dialogs/transactions/transaction-dialog"
import { DateRange } from "react-day-picker"
import { BulkCategoryChangeDialog } from "../bulk-category-change"
import { Transaction } from "@/app/types/transaction"
import { TransactionFormValues } from "../transaction-dialogs/shared/schema"

interface TransactionsTableProps {
  loading?: boolean
  showFilters?: boolean
  showPagination?: boolean
  showRowsCount?: boolean
  itemsPerPage?: number
  sortBy?: {
    field: string
    order: 'asc' | 'desc'
  }
  className?: string
  dateRange?: DateRange
  data: Transaction[]
  onDelete?: (id: number) => void
  onBulkDelete?: (ids: number[]) => void
  onEdit?: (id: number, data: Partial<Transaction>) => void
  onBulkEdit?: (ids: number[], changes: Partial<Transaction>) => void
  type?: 'recurring' | 'upcoming'
}

export function TransactionsTable({
  showFilters = true,
  showPagination = true,
  showRowsCount = true,
  itemsPerPage = 10,
  sortBy,
  className,
  dateRange,
  data,
  onDelete,
  onBulkDelete,
  onEdit,
  onBulkEdit,
  type = 'upcoming'
}: TransactionsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [editingTransaction, setEditingTransaction] = React.useState<Transaction | null>(null)
  const [transactionDialogData, setTransactionDialogData] = React.useState<Partial<TransactionFormValues>>({})
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false)
  const [transactionToDelete, setTransactionToDelete] = React.useState<number | null>(null)
  const [isBulkCategoryDialogOpen, setIsBulkCategoryDialogOpen] = React.useState(false)
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = React.useState(false)

  const getCategoryName = (categoryId: number) => {
    return categories.find(cat => cat.id === categoryId)?.name || 'Uncategorized'
  }

  const columns: ColumnDef<Transaction>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "amount",
      header: ({ column }) => {
        return (
          <div className="text-right">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Amount
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"))
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amount)
        return <div className="text-right font-medium">{formatted}</div>
      },
    },
    {
      accessorKey: "category_id",
      header: "Category",
      cell: ({ row }) => {
        const categoryId = row.getValue("category_id") as number
        return <Badge>{getCategoryName(categoryId)}</Badge>
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <div>{row.getValue("description")}</div>,
    },
    {
      accessorKey: type === 'recurring' ? 'start_date' : 'date',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {type === 'recurring' ? 'Start Date' : 'Date'}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const dateValue = type === 'recurring' 
          ? row.getValue("start_date") 
          : row.getValue("date")
        if (!dateValue || dateValue === '') return null
        const date = new Date(dateValue as string)
        return <div>{format(date, 'MM/dd/yyyy')}</div>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const transaction = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(transaction.id.toString())
                }}
              >
                Copy transaction ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleEditTransaction(transaction)}>
                Edit transaction
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setTransactionToDelete(transaction.id)
                setIsConfirmDialogOpen(true)
              }}>
                Delete transaction
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: (row, id, filterValue) => {
      const safeValue = (value: any) => (typeof value === 'number' ? value.toString() : (value ?? ''))
      return ['name', 'amount', 'description'].some(key => 
        safeValue(row.getValue(key))
          .toLowerCase()
          .includes((filterValue as string).toLowerCase())
      )
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: itemsPerPage,
      },
    },
  })

  const handleDeleteTransaction = (id: number) => {
    onDelete?.(id)
    setIsConfirmDialogOpen(false)
    setTransactionToDelete(null)
  }

  const handleEditTransaction = (transaction: Transaction) => {
    // Only include fields that match TransactionFormValues schema
    const formData: Partial<TransactionFormValues> = {
      name: transaction.name,
      amount: transaction.amount,
      date: new Date(transaction.date),
      type: transaction.type as TransactionFormValues['type'] || 'expense',
      account_type: transaction.account_type as TransactionFormValues['account_type'] || 'cash',
      category_id: String(transaction.category_id || ''),
      // Optional fields
      description: transaction.description || undefined,
      recurring_frequency: transaction.recurring_frequency as TransactionFormValues['recurring_frequency'],
      // Only include valid datetime strings for created_at and updated_at
      ...(transaction.created_at && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(transaction.created_at) && {
        created_at: transaction.created_at
      }),
      ...(transaction.updated_at && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(transaction.updated_at) && {
        updated_at: transaction.updated_at
      })
    }
    setEditingTransaction(transaction)
    setTransactionDialogData(formData)
    setIsTransactionDialogOpen(true)
  }

  function handleBulkCategoryChange(categoryId: number): void {
    throw new Error("Function not implemented.")
  }

  return (
    <div className={cn("w-full space-y-4", className)}>
      {showFilters && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Input
            placeholder="Filter transactions..."
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
          <div className="flex flex-col md:flex-row gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Bulk Actions <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  const selectedIds = Object.keys(rowSelection)
                  onBulkDelete?.(selectedIds.map(Number))
                  setRowSelection({})
                }}>
                  Delete Selected
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsBulkCategoryDialogOpen(true)}>
                  Change Category
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </DropdownMenu>
          </div>
        </div>
      )}
      
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {(showPagination || showRowsCount) && (
        <div className="flex items-center justify-end space-x-2 py-4">
          {showRowsCount && (
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
          )}
          {showPagination && (
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      <TransactionDialog
        isOpen={isTransactionDialogOpen}
        onClose={() => setIsTransactionDialogOpen(false)}
        onSubmit={(formData) => {
          if (editingTransaction) {
            // Convert form data to match Transaction type
            const transactionData: Partial<Transaction> = {
              ...formData,
              // Convert Date to ISO string (YYYY-MM-DD)
              date: formData.date.toISOString().split('T')[0],
              // Ensure category_id is a number or null
              category_id: formData.category_id ? Number(formData.category_id) : null
            }
            onEdit?.(editingTransaction.id, transactionData)
            setIsTransactionDialogOpen(false)
            setEditingTransaction(null)
          }
        }}
        initialData={transactionDialogData}
        mode="edit"
      />

      <ConfirmationDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={() => transactionToDelete && handleDeleteTransaction(transactionToDelete)}
        title="Delete Transaction"
        description="Are you sure you want to delete this transaction?"
      />

      <BulkCategoryChangeDialog
        isOpen={isBulkCategoryDialogOpen}
        onClose={() => setIsBulkCategoryDialogOpen(false)}
        onSave={handleBulkCategoryChange}
        selectedCount={Object.keys(rowSelection).length}
      />
    </div>
  )
}

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
import { RecurringTransactionDialog } from "../transaction-dialogs/recurring-transactions/recurring-transaction-dialog"
import { DateRange } from "react-day-picker"
import { BulkCategoryChangeDialog } from "../bulk-category-change"
import { Transaction } from "@/app/types/transaction"
import { TransactionFormValues } from "../transaction-dialogs/shared/schema"
import { FrequencyType } from "@/data/frequencies"

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
  const [isRecurringTransactionDialogOpen, setIsRecurringTransactionDialogOpen] = React.useState(false)
  
  // For bulk deletion
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = React.useState(false)
  const [transactionsToDelete, setTransactionsToDelete] = React.useState<number[]>([])

  const getCategoryName = (categoryId: number) => {
    return categories.find(cat => cat.id === categoryId)?.name || 'Uncategorized'
  }

  const columns: ColumnDef<Transaction>[] = [
    {
      id: "select",
      // Only show checkboxes for regular transactions, not for upcoming transactions
      header: ({ table }) => (
        type !== 'upcoming' ? (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ) : null
      ),
      cell: ({ row }) => (
        type !== 'upcoming' ? (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ) : null
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
    // End Date column - only visible for recurring transactions
    ...(type === 'recurring' ? [{
      accessorKey: "end_date",
      header: "End Date",
      cell: ({ row }: { row: any }) => {
        const dateValue = row.getValue("end_date")
        if (!dateValue || dateValue === '') return <div>No end date</div>
        const date = new Date(dateValue as string)
        return <div>{format(date, 'MM/dd/yyyy')}</div>
      },
    }] : []),
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
                  if (transaction.id !== undefined) {
                    navigator.clipboard.writeText(transaction.id.toString())
                  }
                }}
              >
                Copy transaction ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {type === 'upcoming' && transaction.predicted ? (
                // For predicted upcoming transactions, don't show edit or delete options
                <DropdownMenuItem disabled className="text-muted-foreground">
                  Predicted transaction (cannot be edited)
                </DropdownMenuItem>
              ) : type === 'upcoming' && transaction.recurring_transaction_id ? (
                // For upcoming transactions, show informational message
                <DropdownMenuItem disabled className="text-muted-foreground">
                  Upcoming transaction (cannot be edited)
                </DropdownMenuItem>
              ) : (
                // For regular transactions, show the normal edit option
                <DropdownMenuItem onClick={() => handleEditTransaction(transaction)}>
                  Edit transaction
                </DropdownMenuItem>
              )}
              {type === 'upcoming' ? (
                // For upcoming transactions, don't show delete option
                <DropdownMenuItem disabled className="text-muted-foreground">
                  Upcoming transactions cannot be deleted
                </DropdownMenuItem>
              ) : (
                // For regular transactions, show the normal delete option
                <DropdownMenuItem onClick={() => {
                  if (transaction.id !== undefined) {
                    setTransactionToDelete(transaction.id)
                    setIsConfirmDialogOpen(true)
                  }
                }}>
                  Delete transaction
                </DropdownMenuItem>
              )}
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

  const handleDeleteTransaction = (id: number | null) => {
    if (id !== null && id !== undefined) {
      // Call onDelete with the id (which is now guaranteed to be a number)
      onDelete?.(id)
      setIsConfirmDialogOpen(false)
      setTransactionToDelete(null)
    }
  }

  const handleEditTransaction = (transaction: Transaction) => {
    console.log('Edit transaction called with:', transaction)
    
    // Set the editing transaction
    setEditingTransaction(transaction)
    
    // For recurring transactions, use the RecurringTransactionDialog
    if (type === 'recurring') {
      // Prepare data for recurring transaction form
      const recurringFormData = {
        name: transaction.name,
        amount: transaction.amount,
        type: transaction.type as TransactionFormValues['type'],
        account_type: transaction.account_type as TransactionFormValues['account_type'],
        category_id: transaction.category_id ? String(transaction.category_id) : '',
        description: transaction.description || '',
        // Use start_date instead of date for recurring transactions
        start_date: transaction.start_date ? 
          (transaction.start_date instanceof Date ? 
            transaction.start_date : 
            new Date(transaction.start_date as string)) : 
          new Date(),
        // Handle end_date which might be null
        end_date: transaction.end_date ? 
          (transaction.end_date instanceof Date ? 
            transaction.end_date : 
            new Date(transaction.end_date as string)) : 
          undefined,
        // Use recurring_frequency as frequency
        frequency: transaction.recurring_frequency as FrequencyType || 'Monthly',
      }
      
      console.log('Prepared recurring form data:', recurringFormData)
      
      setTransactionDialogData(recurringFormData)
      setIsRecurringTransactionDialogOpen(true)
    } else {
      // Regular transaction form data
      const formData: Partial<TransactionFormValues> = {
        name: transaction.name,
        amount: transaction.amount,
        // Ensure date is properly converted to a Date object
        date: transaction.date instanceof Date ? transaction.date : new Date(transaction.date),
        type: transaction.type as TransactionFormValues['type'],
        account_type: transaction.account_type as TransactionFormValues['account_type'],
        // Convert category_id to string (required by the form)
        category_id: transaction.category_id ? String(transaction.category_id) : '',
        // Optional fields
        description: transaction.description || '',
        recurring_frequency: transaction.recurring_frequency as TransactionFormValues['recurring_frequency'] || 'Never',
      }
      
      console.log('Prepared form data:', formData)
      
      setTransactionDialogData(formData)
      setIsTransactionDialogOpen(true)
    }
  }

  function handleBulkCategoryChange(categoryId: number): void {
    // Get the selected row indices
    const selectedRowIndices = Object.keys(rowSelection)
    
    if (selectedRowIndices.length === 0) {
      return // No rows selected
    }
    
    // Get the actual transaction IDs from the selected rows
    const selectedTransactionIds = selectedRowIndices
      .map(index => {
        const row = table.getRowModel().rows[Number(index)]
        const transaction = row?.original as Transaction
        return transaction?.id
      })
      .filter((id): id is number => id !== undefined)
    
    console.log('Selected transaction IDs for category change:', selectedTransactionIds)
    console.log('New category ID:', categoryId)
    
    if (selectedTransactionIds.length > 0) {
      // Call the onBulkEdit function with the transaction IDs and the new category ID
      onBulkEdit?.(selectedTransactionIds, { category_id: categoryId })
      // Clear the selection
      setRowSelection({})
      // Close the dialog
      setIsBulkCategoryDialogOpen(false)
    }
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
            {/* Only show bulk actions for regular transactions, not for upcoming transactions */}
            {type !== 'upcoming' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Bulk Actions <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    // Get the selected row indices
                    const selectedRowIndices = Object.keys(rowSelection)
                    
                    if (selectedRowIndices.length === 0) {
                      return // No rows selected
                    }
                    
                    // Get the actual transaction IDs from the selected rows
                    const selectedTransactionIds = selectedRowIndices
                      .map(index => {
                        const row = table.getRowModel().rows[Number(index)]
                        const transaction = row?.original as Transaction
                        return transaction?.id
                      })
                      .filter((id): id is number => id !== undefined)
                    
                    console.log('Selected transaction IDs for deletion:', selectedTransactionIds)
                    
                    if (selectedTransactionIds.length > 0) {
                      // Store the IDs and open the confirmation dialog
                      setTransactionsToDelete(selectedTransactionIds)
                      setIsBulkDeleteDialogOpen(true)
                    }
                  }}>
                    Delete Selected
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsBulkCategoryDialogOpen(true)}>
                    Change Category
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
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
        onClose={() => {
          setIsTransactionDialogOpen(false)
          setEditingTransaction(null)
          setTransactionDialogData({})
        }}
        onSubmit={(formData) => {
          if (editingTransaction) {
            // Convert form data to match Transaction type
            const transactionData: Partial<Transaction> = {
              ...formData,
              // Convert Date to ISO string
              date: formData.date instanceof Date ? formData.date.toISOString() : formData.date,
              // Ensure category_id is a number or undefined (not null)
              category_id: formData.category_id ? Number(formData.category_id) : undefined
            }
            // Make sure editingTransaction.id is defined before calling onEdit
            if (editingTransaction.id !== undefined) {
              onEdit?.(editingTransaction.id, transactionData)
            }
            setIsTransactionDialogOpen(false)
            setEditingTransaction(null)
            setTransactionDialogData({})
          }
        }}
        initialData={transactionDialogData}
        mode="edit"
      />
      
      <RecurringTransactionDialog
        isOpen={isRecurringTransactionDialogOpen}
        onClose={() => {
          setIsRecurringTransactionDialogOpen(false)
          setEditingTransaction(null)
          setTransactionDialogData({})
        }}
        onSubmit={(formData) => {
          if (editingTransaction) {
            // Convert form data to match Transaction type
            const transactionData: Partial<Transaction> = {
              ...formData,
              // Map fields correctly for recurring transactions
              start_date: formData.start_date instanceof Date ? formData.start_date.toISOString() : formData.start_date,
              end_date: formData.end_date instanceof Date ? formData.end_date.toISOString() : formData.end_date,
              recurring_frequency: formData.frequency,
              // Ensure category_id is a number or undefined (not null)
              category_id: formData.category_id ? Number(formData.category_id) : undefined
            }
            // Make sure editingTransaction.id is defined before calling onEdit
            if (editingTransaction.id !== undefined) {
              onEdit?.(editingTransaction.id, transactionData)
            }
            setIsRecurringTransactionDialogOpen(false)
            setEditingTransaction(null)
            setTransactionDialogData({})
          }
        }}
        initialData={transactionDialogData}
        mode="edit"
      />

      <ConfirmationDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => {
          setIsConfirmDialogOpen(false)
          setTransactionToDelete(null)
        }}
        onConfirm={() => {
          // Only call handleDeleteTransaction if transactionToDelete is a number
          if (typeof transactionToDelete === 'number') {
            handleDeleteTransaction(transactionToDelete)
          }
        }}
        title={type === 'upcoming' ? "Delete Recurring Transaction" : "Delete Transaction"}
        description={type === 'upcoming' 
          ? "Are you sure you want to delete this recurring transaction? This will remove all future occurrences. This action cannot be undone."
          : "Are you sure you want to delete this transaction? This action cannot be undone."}
      />

      {/* Confirmation dialog for bulk deletion */}
      <ConfirmationDialog
        isOpen={isBulkDeleteDialogOpen}
        onClose={() => {
          setIsBulkDeleteDialogOpen(false)
          setTransactionsToDelete([])
        }}
        onConfirm={() => {
          if (transactionsToDelete.length > 0) {
            // Call the onBulkDelete function with the transaction IDs
            onBulkDelete?.(transactionsToDelete)
            // Clear the selection
            setRowSelection({})
            // Close the dialog
            setIsBulkDeleteDialogOpen(false)
            setTransactionsToDelete([])
          }
        }}
        title="Delete Selected Transactions"
        description={`Are you sure you want to delete ${transactionsToDelete.length} selected transaction(s)? This action cannot be undone.`}
      />

      <BulkCategoryChangeDialog
        isOpen={isBulkCategoryDialogOpen}
        onClose={() => setIsBulkCategoryDialogOpen(false)}
        onSave={handleBulkCategoryChange}
        selectedCount={Object.keys(rowSelection).length}
      />

      {/* Confirmation dialog for bulk deletion */}
      <ConfirmationDialog
        isOpen={isBulkDeleteDialogOpen}
        onClose={() => {
          setIsBulkDeleteDialogOpen(false)
          setTransactionsToDelete([])
        }}
        onConfirm={() => {
          if (transactionsToDelete.length > 0) {
            // Call the onBulkDelete function with the transaction IDs
            onBulkDelete?.(transactionsToDelete)
            // Clear the selection
            setRowSelection({})
            // Close the dialog
            setIsBulkDeleteDialogOpen(false)
            setTransactionsToDelete([])
          }
        }}
        title="Delete Selected Transactions"
        description={`Are you sure you want to delete ${transactionsToDelete.length} selected transaction(s)? This action cannot be undone.`}
      />
    </div>
  )
}

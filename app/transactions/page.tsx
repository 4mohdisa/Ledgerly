"use client"

import React, { useState, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Plus, Menu } from 'lucide-react'
import { TransactionsTable } from "@/components/app/tables/transactions-table"
import { AppSidebar } from '@/components/app/app-sidebar'
import { DateRangePickerWithRange } from '@/components/app/date-range-picker'
import { TransactionDialog } from '@/components/app/transaction-dialog'
import { DateRange } from "react-day-picker"
import { startOfMonth, endOfMonth, format } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { transactions } from '@/data/transactions'

export default function TransactionsPage() {
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const [transactionsList, setTransactionsList] = useState(transactions)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  })

  const handleAddTransaction = useCallback(() => {
    setIsAddTransactionOpen(true)
  }, [])

  const handleDateRangeChange = useCallback((newDateRange: DateRange | undefined) => {
    if (newDateRange?.from && newDateRange?.to) {
      const from = startOfMonth(newDateRange.from)
      const to = endOfMonth(newDateRange.from)
      setDateRange({ from, to })
    }
  }, [])

  const handleTransactionSubmit = useCallback((data: any) => {
    setTransactionsList(prev => [...prev, { ...data, id: Date.now().toString() }])
    setIsAddTransactionOpen(false)
  }, [])

  const handleDeleteTransaction = useCallback((id: string) => {
    setTransactionsList(prev => prev.filter(transaction => transaction.id !== id))
  }, [])

  const handleBulkDelete = useCallback((ids: string[]) => {
    setTransactionsList(prev => prev.filter(transaction => !ids.includes(transaction.id)))
  }, [])

  const handleEditTransaction = useCallback((id: string, formData: any) => {
    setTransactionsList(prev => prev.map(transaction => 
      transaction.id === id ? { ...transaction, ...formData } : transaction
    ))
  }, [])

  const handleBulkEdit = useCallback((ids: string[], changes: Partial<any>) => {
    setTransactionsList(prev => prev.map(transaction => 
      ids.includes(transaction.id) ? { ...transaction, ...changes } : transaction
    ))
  }, [])

  return (
    <div className="flex h-screen w-full">
      <div className="w-64 flex-shrink-0">
        <AppSidebar />
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="container h-full flex flex-col px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold">Transactions</h1>
            <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
              <DateRangePickerWithRange onDateRangeChange={handleDateRangeChange} />
              <div className="flex gap-4 ml-auto">
                <div className="md:hidden w-full">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="w-full">
                        <Menu className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={handleAddTransaction}>
                        Add Transaction
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="hidden md:flex gap-4">
                  <Button onClick={handleAddTransaction}>
                    <Plus className="mr-2 h-4 w-4" /> Add Transaction
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <TransactionsTable
              showFilters={true}
              showPagination={true}
              showRowsCount={true}
              itemsPerPage={10}
              sortBy={{
                field: "date",
                order: "desc"
              }}
              className="h-full"
              dateRange={dateRange}
              data={transactionsList}
              onDelete={handleDeleteTransaction}
              onBulkDelete={handleBulkDelete}
              onEdit={handleEditTransaction}
              onBulkEdit={handleBulkEdit}
            />
          </div>
        </div>
      </div>

      <TransactionDialog
        isOpen={isAddTransactionOpen}
        onClose={() => setIsAddTransactionOpen(false)}
        onSubmit={handleTransactionSubmit}
        mode="create"
      />
    </div>
  )
}

// Add console log for debugging
console.log("Transactions page rendered");

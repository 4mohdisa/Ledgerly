'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Upload, Plus, Menu } from 'lucide-react'
import { MetricsCards } from "@/components/app/metrics-cards"
import { SpendingChart } from "@/components/app/charts/bar-chart-multiple"
import { PieDonutChart } from "@/components/app/charts/pie-donut-chart"
import { TransactionsTable } from "@/components/app/tables/transactions-table"
import { TransactionChart } from "@/components/app/charts/bar-chart-interactive"
import { NetBalanceChart } from "@/components/app/charts/line-chart"
import { DateRange } from "react-day-picker"
import { startOfMonth, endOfMonth, format, isFirstDayOfMonth } from "date-fns"
import { BalanceDialog } from "@/components/app/balance-dialog"
import { TransactionDialog } from "@/components/app/transaction-dialogs/transactions/transaction-dialog"
import { UploadDialog } from "@/components/app/upload-dialog"
import { transactionService } from '@/app/services/transaction-services'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MonthPicker } from '@/components/app/month-picker'
import { transactions } from '@/data/transactions'

// Define default date range outside the component
const defaultDateRange = {
  from: startOfMonth(new Date()),
  to: endOfMonth(new Date())
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const [isUploadFileOpen, setIsUploadFileOpen] = useState(false)
  const [isBalanceDialogOpen, setIsBalanceDialogOpen] = useState(false)
  const [isEditingBalance, setIsEditingBalance] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultDateRange)

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => setIsLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  const handleAddTransaction = useCallback(() => {
    setIsAddTransactionOpen(true)
  }, [])

  const handleUploadFile = useCallback(() => {
    setIsUploadFileOpen(true)
  }, [])

  const handleAddBalance = useCallback(() => {
    setIsBalanceDialogOpen(true)
  }, [])

  const handleDateRangeChange = useCallback((newDateRange: DateRange | undefined) => {
    if (newDateRange?.from && newDateRange?.to) {
      const from = startOfMonth(newDateRange.from)
      const to = endOfMonth(newDateRange.from)
      setDateRange({ from, to })
      console.log(`Date range changed: ${format(from, 'yyyy-MM-dd')} to ${format(to, 'yyyy-MM-dd')}`)
    }
  }, [])

  const handleDateChange = useCallback((date: Date) => {
    setSelectedDate(date)
  }, [])

  const isAddBalanceVisible = isFirstDayOfMonth(new Date()) // This is a simplified check. You might want to implement more sophisticated logic.

  const handleTransactionSubmit = async (data: any) => {
    try {
      if (data.transactionType === "regular") {
        await transactionService.createTransaction(data, "user_id_here")
      } else {
        await transactionService.createRecurringTransaction(data, "user_id_here")
      }
      console.log("Transaction created successfully:", data)
    } catch (error) {
      console.error("Failed to create transaction:", error)
    }
  }

  const handleBulkEdit = useCallback((ids: string[], changes: Partial<any>) => {
    setTransactionsList(prev => prev.map((transaction: { id: string }) =>
      ids.includes(transaction.id) ? { ...transaction, ...changes } : transaction
    ))
  }, [])

  const dateRangeValue = useMemo(() => dateRange ?? defaultDateRange, [dateRange])

  return (
    <div className="flex-grow">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
            <MonthPicker
              date={selectedDate}
              onDateChange={handleDateChange} />
            <div className="flex gap-4">
              <div className="md:hidden w-full">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="w-full">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setIsAddTransactionOpen(true)}>
                      Add Transaction
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleUploadFile}>
                      Upload File
                    </DropdownMenuItem>
                    {isAddBalanceVisible && (
                      <DropdownMenuItem onSelect={handleAddBalance}>
                        Add Balance
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="hidden md:flex gap-4">
                <Button onClick={() => setIsAddTransactionOpen(true)}>
                  Add Transaction
                </Button>
                <Button onClick={handleUploadFile} variant="outline">
                  <Upload className="mr-2 h-4 w-4" /> Upload File
                </Button>
                {/* {isAddBalanceVisible && ( */}
                <Button onClick={handleAddBalance} variant="secondary">
                  <Plus className="mr-2 h-4 w-4" /> Add Balance
                </Button>
                {/* )} */}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <MetricsCards />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3">
              <TransactionChart />
            </div>

            <div className="lg:col-span-1">
              <NetBalanceChart />
            </div>

            <div>
              <SpendingChart />
            </div>

            <div>
              <PieDonutChart />
            </div>
          </div>

          <TransactionsTable
            data={transactions} />
        </div>
      </div>

      <BalanceDialog
        open={isBalanceDialogOpen}
        onOpenChange={setIsBalanceDialogOpen} />

      <TransactionDialog
        isOpen={isAddTransactionOpen}
        onClose={() => setIsAddTransactionOpen(false)}
        onSubmit={handleTransactionSubmit}
        mode="create" />

      <UploadDialog
        open={isUploadFileOpen}
        onOpenChange={setIsUploadFileOpen} />
    </div>
  )
}

function setTransactionsList(arg0: (prev: any) => any) {
  throw new Error('Function not implemented.')
}

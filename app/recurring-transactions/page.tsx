"use client"

import React, { useState, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Plus, Menu } from 'lucide-react'
import { AppSidebar } from '@/components/app/app-sidebar'
import { DateRangePickerWithRange } from '@/components/app/date-range-picker'
import { TransactionDialog } from '@/components/app/transaction-dialog'
import { TransactionsTable } from '@/components/app/tables/transactions-table'
import { DateRange } from "react-day-picker"
import { startOfMonth, endOfMonth } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { recurringTransactions } from "@/data/recurring-transactions"
import { upcomingTransactions } from "@/data/upcoming-transactions"
import { PieDonutChart } from "@/components/app/charts/pie-donut-chart"
import { TransactionChart } from "@/components/app/charts/bar-chart-interactive"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function RecurringTransactionsPage() {
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
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
    console.log('New recurring transaction:', data)
    setIsAddTransactionOpen(false)
  }, [])

  return (
    <div className="flex h-screen w-full">
      <div className="w-64 flex-shrink-0">
        <AppSidebar />
      </div>
      <div className="flex-1">
        <div className="container h-full flex flex-col px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold">Recurring Transactions</h1>
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
                        Add Recurring Transaction
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="hidden md:flex gap-4">
                  <Button onClick={handleAddTransaction}>
                    <Plus className="mr-2 h-4 w-4" /> Add Recurring Transaction
                  </Button>
                </div>
              </div>
            </div>
          </div>
          {/* Analytics Charts Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Transaction Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-none shadow-none bg-transparent">
                <CardHeader>
                  <CardTitle>Recurring by Category</CardTitle>
                  <CardDescription>Distribution of recurring transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <PieDonutChart />
                </CardContent>
              </Card>
              <Card className="border-none shadow-none bg-transparent">
                <CardHeader>
                  <CardTitle>Upcoming Transactions</CardTitle>
                  <CardDescription>Next 30 days transaction forecast</CardDescription>
                </CardHeader>
                <CardContent>
                  <TransactionChart 
                    transactions={upcomingTransactions || []}
                    metrics={[
                      { key: "income", label: "Income", color: "hsl(var(--chart-1))" },
                      { key: "expense", label: "Expense", color: "hsl(var(--chart-2))" }
                    ]}
                    chartType="bar"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
          {/* Recurring Transactions Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Active Recurring Transactions</h2>
            <CardContent className="p-0">
              <TransactionsTable
                data={recurringTransactions}
                showFilters={true}
                showPagination={true}
                showRowsCount={true}
                itemsPerPage={10}
                sortBy={{
                  field: "start_date",
                  order: "desc"
                }}
                className="h-full"
                dateRange={dateRange}
                type="recurring"
              />
            </CardContent>
          </div>

          {/* Upcoming Transactions Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Upcoming Transactions</h2>

            <CardContent className="p-0">
              <TransactionsTable
                data={upcomingTransactions.map(transaction => ({
                  ...transaction,
                  name: `${transaction.category_name} Payment`,
                  account_type: 'Checking' // Default to Checking, adjust as needed
                }))}
                showFilters={true}
                showPagination={true}
                showRowsCount={true}
                itemsPerPage={10}
                sortBy={{
                  field: "date",
                  order: "asc"
                }}
                className="h-full"
                dateRange={dateRange}
                type="upcoming"
              />
            </CardContent>
          </div>
        </div>
      </div>

      <TransactionDialog
        isOpen={isAddTransactionOpen}
        onClose={() => setIsAddTransactionOpen(false)}
        onSubmit={handleTransactionSubmit}
        mode="create"
        transactionType="recurring"
      />
    </div>
  )
}
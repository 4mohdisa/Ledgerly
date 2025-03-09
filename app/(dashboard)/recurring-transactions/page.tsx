"use client"

import React, { useState, useCallback, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Plus, Menu } from 'lucide-react'
import { toast } from "sonner"

import { DateRangePickerWithRange } from '@/components/app/date-range-picker'
import { RecurringTransactionDialog } from '@/components/app/transaction-dialogs/recurring-transactions/recurring-transaction-dialog'
import { TransactionsTable } from '@/components/app/tables/transactions-table'
import { DateRange } from "react-day-picker"
import { startOfMonth, endOfMonth } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Transaction, FrequencyType, RecurringTransaction } from "@/app/types/transaction"
import { upcomingTransactions } from "@/data/upcoming-transactions"
import { PieDonutChart } from "@/components/app/charts/pie-donut-chart"
import { TransactionChart } from "@/components/app/charts/bar-chart-interactive"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/utils/supabase/client"
import { transactionService } from "@/app/services/transaction-services"
  
export default function RecurringTransactionsPage() {
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  })
  const [loading, setLoading] = useState(true)
  // Define a type that extends RecurringTransaction to include the categories field from Supabase join
  type RecurringTransactionWithCategories = RecurringTransaction & {
    categories?: { name: string } | null
  }
  
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransactionWithCategories[]>([])
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  // Fetch user and recurring transactions
  useEffect(() => {
    const fetchUserAndTransactions = async () => {
      try {
        setLoading(true)
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          toast.error("Authentication required", {
            description: "Please sign in to view recurring transactions.",
          })
          setLoading(false)
          return
        }
        
        setUser(user)
        
        // Fetch recurring transactions for the user
        const transactions = await transactionService.getRecurringTransactions(user.id)
        // Ensure all required fields are present and handle null values
        const validTransactions = (transactions || []).map(t => ({
          ...t,
          user_id: t.user_id || user.id, // Use current user ID if null
          category_id: t.category_id || 0 // Default to 0 if null
        })) as RecurringTransactionWithCategories[]
        
        setRecurringTransactions(validTransactions)
      } catch (error) {
        console.error("Error fetching recurring transactions:", error)
        toast.error("Failed to load recurring transactions", {
          description: "Please try again later.",
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchUserAndTransactions()
  }, [])

  const handleAddTransaction = useCallback(() => {
    setIsAddTransactionOpen(true)
  }, [])

  const handleDateRangeChange = useCallback((newDateRange: DateRange | undefined) => {
    if (!newDateRange) {
      // If date range is cleared, show all recurring transactions from the current month
      setDateRange(undefined)
      return
    }
    
    // Use the exact dates selected by the user
    setDateRange({
      from: newDateRange.from,
      to: newDateRange.to || newDateRange.from
    })
  }, [])

  const handleTransactionSubmit = useCallback(async (data: any) => {
    try {
      await transactionService.createRecurringTransaction(data)
      toast.success("Recurring transaction created", {
        description: "Your recurring transaction has been successfully created.",
      })
      
      // Refresh the transactions list
      if (user) {
        const transactions = await transactionService.getRecurringTransactions(user.id)
        // Ensure all required fields are present and handle null values
        const validTransactions = (transactions || []).map(t => ({
          ...t,
          user_id: t.user_id || user.id, // Use current user ID if null
          category_id: t.category_id || 0 // Default to 0 if null
        })) as RecurringTransactionWithCategories[]
        
        setRecurringTransactions(validTransactions)
      }
    } catch (error) {
      console.error("Error creating recurring transaction:", error)
      toast.error("Failed to create recurring transaction", {
        description: "Please try again later.",
      })
    } finally {
      setIsAddTransactionOpen(false)
    }
  }, [user])

  return (
    <div className="h-full flex flex-col">
      <div className="container h-full flex flex-col mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold">Recurring Transactions</h1>
            <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
              <DateRangePickerWithRange dateRange={dateRange} onDateRangeChange={handleDateRangeChange} />
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
                    transactions={upcomingTransactions.map(ut => ({
                      id: typeof ut.id === 'string' ? parseInt(ut.id.replace('#UT', '')) : ut.id,
                      user_id: String(ut.user_id),
                      date: ut.date,
                      amount: ut.amount,
                      name: `Upcoming: ${ut.category_name}`,
                      description: '',
                      type: ut.type,
                      account_type: 'Checking', // Default account type
                      category_id: ut.category_id,
                      category_name: ut.category_name
                    })) || []}
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
                loading={loading}
                data={recurringTransactions.map(rt => {
                  // Extract category name from the joined categories data
                  const categoryName = rt.categories?.name || ''
                  
                  return {
                    id: rt.id,
                    user_id: rt.user_id,
                    date: rt.start_date, // Map start_date to date for filtering
                    start_date: rt.start_date, // Include start_date for recurring transactions
                    end_date: rt.end_date,
                    amount: rt.amount,
                    name: rt.name,
                    description: rt.description,
                    type: rt.type,
                    account_type: rt.account_type,
                    category_id: rt.category_id,
                    category_name: categoryName,
                    recurring_frequency: rt.frequency, // Use frequency from RecurringTransaction
                    created_at: rt.created_at,
                    updated_at: rt.updated_at
                  }
                }) as Transaction[]}
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
                type="recurring"
                onDelete={async (id) => {
                  if (!user) return
                  try {
                    await transactionService.deleteRecurringTransaction(id, user.id)
                    toast.success("Recurring transaction deleted")
                    // Refresh the transactions list
                    const transactions = await transactionService.getRecurringTransactions(user.id)
                    // Ensure all required fields are present and handle null values
                    const validTransactions = (transactions || []).map(t => ({
                      ...t,
                      user_id: t.user_id || user.id, // Use current user ID if null
                      category_id: t.category_id || 0 // Default to 0 if null
                    })) as RecurringTransactionWithCategories[]
                    
                    setRecurringTransactions(validTransactions)
                  } catch (error) {
                    console.error("Error deleting recurring transaction:", error)
                    toast.error("Failed to delete recurring transaction")
                  }
                }}
                onEdit={async (id, data) => {
                  if (!user) return
                  try {
                    // Convert Transaction type to RecurringTransaction type
                    const updateData: Partial<Omit<RecurringTransaction, 'id' | 'user_id'>> = {
                      name: data.name,
                      amount: data.amount,
                      type: data.type,
                      account_type: data.account_type,
                      category_id: data.category_id,
                      description: data.description,
                      // Map date fields correctly
                      start_date: data.start_date ? (typeof data.start_date === 'string' ? data.start_date : data.start_date.toISOString()) : undefined,
                      end_date: data.end_date ? (typeof data.end_date === 'string' ? data.end_date : data.end_date.toISOString()) : null,
                      frequency: data.recurring_frequency as FrequencyType || undefined
                    }
                    
                    await transactionService.updateRecurringTransaction(id, updateData, user.id)
                    toast.success("Recurring transaction updated")
                    // Refresh the transactions list
                    const transactions = await transactionService.getRecurringTransactions(user.id)
                    // Ensure all required fields are present and handle null values
                    const validTransactions = (transactions || []).map(t => ({
                      ...t,
                      user_id: t.user_id || user.id, // Use current user ID if null
                      category_id: t.category_id || 0 // Default to 0 if null
                    })) as RecurringTransactionWithCategories[]
                    
                    setRecurringTransactions(validTransactions)
                  } catch (error) {
                    console.error("Error updating recurring transaction:", error)
                    toast.error("Failed to update recurring transaction")
                  }
                }}
              />
            </CardContent>
          </div>

          {/* Upcoming Transactions Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Upcoming Transactions</h2>

            <CardContent className="p-0">
              <TransactionsTable
                data={upcomingTransactions.map(transaction => ({
                  id: typeof transaction.id === 'string' ? parseInt(transaction.id.replace('#UT', '')) : transaction.id,
                  user_id: String(transaction.user_id),
                  date: transaction.date,
                  amount: transaction.amount,
                  name: `${transaction.category_name} Payment`,
                  description: '',
                  type: transaction.type,
                  account_type: 'Checking', // Default to Checking
                  category_id: transaction.category_id,
                  category_name: transaction.category_name,
                  created_at: transaction.created_at,
                  updated_at: transaction.updated_at
                })) as Transaction[]}
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

      <RecurringTransactionDialog
        isOpen={isAddTransactionOpen}
        onClose={() => setIsAddTransactionOpen(false)}
        onSubmit={handleTransactionSubmit}
        mode="create"
      />
    </div>
  )
}
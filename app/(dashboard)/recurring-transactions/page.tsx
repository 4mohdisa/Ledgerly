"use client"

import React, { useState, useCallback, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Plus, Menu } from 'lucide-react'
import { toast } from "sonner"

import { DateRangePickerWithRange } from '@/components/app/date-range-picker'
import { RecurringTransactionDialog } from '@/components/app/transaction-dialogs/recurring-transactions/recurring-transaction-dialog'
import { TransactionsTable } from '@/components/app/tables/transactions-table'
import { DateRange } from "react-day-picker"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Transaction, RecurringTransaction, TransactionType, AccountType } from "@/app/types/transaction"
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
import TransactionConverter from '@/components/app/transaction-converter'

export default function RecurringTransactionsPage() {
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const [isEditRecurringTransactionOpen, setIsEditRecurringTransactionOpen] = useState(false)
  const [editingRecurringTransaction, setEditingRecurringTransaction] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  type RecurringTransactionWithCategories = RecurringTransaction & {
    categories?: { name: string } | null
  }

  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransactionWithCategories[]>([])
  const [upcomingTransactions, setUpcomingTransactions] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  // Define fetch functions first
  const fetchRecurringTransactions = useCallback(async () => {
    if (!user) return
    
    try {
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
      toast.error("Failed to load recurring transactions")
    }
  }, [user])
  
  const fetchUpcomingTransactions = useCallback(async () => {
    if (!user) return
    
    try {
      console.log('Fetching upcoming transactions for user:', user.id);
      
      // First check if we have recurring transactions
      const recurringTxs = await transactionService.getRecurringTransactions(user.id);
      console.log('Recurring transactions found:', recurringTxs?.length || 0);
      
      if (!recurringTxs || recurringTxs.length === 0) {
        console.log('No recurring transactions found, cannot generate upcoming transactions');
        setUpcomingTransactions([]);
        return;
      }
      
      // Force regeneration of upcoming transactions
      const upcoming = await transactionService.generateUpcomingTransactions(user.id);
      console.log('Generated upcoming transactions:', upcoming?.length || 0);    
      setUpcomingTransactions(upcoming || []);
    } catch (error) {
      console.error("Error fetching upcoming transactions:", error)
      toast.error("Failed to load upcoming transactions")
    }
  }, [user])

  // Handle edit and delete functions
  const handleEditSuccess = useCallback(async (transaction: RecurringTransaction) => {
    try {
      if (!user || !transaction.id) return;
      
      // Use the new method that updates recurring transactions and regenerates upcoming ones
      await transactionService.updateRecurringTransactionWithUpcoming(
        transaction.id,
        transaction,
        user.id
      );
      
      toast.success("Transaction updated successfully");
      fetchRecurringTransactions();
      fetchUpcomingTransactions();
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast.error("Failed to update transaction");
    }
  }, [user, fetchRecurringTransactions, fetchUpcomingTransactions]);
  
  const handleDeleteRecurringTransaction = useCallback(async (id: number) => {
    try {
      if (!user) return;
      
      // Use the new method that deletes recurring transactions and their upcoming transactions
      await transactionService.deleteRecurringTransactionWithUpcoming(id, user.id);
      
      toast.success("Transaction deleted successfully");
      fetchRecurringTransactions();
      fetchUpcomingTransactions();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Failed to delete transaction");
    }
  }, [user, fetchRecurringTransactions, fetchUpcomingTransactions]);

  // Handle table edit and delete
  const handleTableEdit = useCallback((id: number, data: Partial<Transaction>) => {
    if (!user) return;
    
    // For upcoming transactions, we need to get the recurring transaction ID
    const recurringId = data.recurring_transaction_id || id;
    
    // Find the recurring transaction
    const recurringTransaction = recurringTransactions.find(rt => rt.id === recurringId);
    
    if (recurringTransaction) {
      // Create a RecurringTransaction object from the existing data
      const transaction: RecurringTransaction = {
        id: recurringTransaction.id,
        user_id: recurringTransaction.user_id,
        name: data.name || recurringTransaction.name,
        amount: data.amount !== undefined ? data.amount : recurringTransaction.amount,
        type: data.type as TransactionType || recurringTransaction.type,
        account_type: data.account_type as AccountType || recurringTransaction.account_type,
        category_id: data.category_id !== undefined ? Number(data.category_id) : recurringTransaction.category_id,
        description: data.description || recurringTransaction.description,
        start_date: data.start_date || recurringTransaction.start_date,
        end_date: data.end_date || recurringTransaction.end_date,
        frequency: recurringTransaction.frequency,
        created_at: recurringTransaction.created_at,
        updated_at: new Date().toISOString()
      };
      
      // Call the edit success handler with the full transaction object
      handleEditSuccess(transaction);
    } else {
      toast.error("Could not find the recurring transaction");
    }
  }, [user, recurringTransactions, handleEditSuccess]);

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

        // Fetch upcoming transactions based on recurring transactions
        console.log('Initial load: Fetching upcoming transactions for user:', user.id);
        
        // First check if we have recurring transactions
        if (validTransactions.length === 0) {
          console.log('No recurring transactions found, cannot generate upcoming transactions');
          setUpcomingTransactions([]);
        } else {
          console.log('Found recurring transactions:', validTransactions.length, 'generating upcoming...');
          
          // Force regeneration of upcoming transactions
          const upcoming = await transactionService.generateUpcomingTransactions(user.id);
          console.log('Generated upcoming transactions:', upcoming?.length || 0);
          
          setUpcomingTransactions(upcoming || []);
        }
      } catch (error) {
        console.error("Error fetching user or transactions:", error)
        toast.error("Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    fetchUserAndTransactions()
  }, [])

  const handleDateRangeChange = useCallback((newDateRange: DateRange | undefined) => {
    if (!newDateRange || !newDateRange.from) {
      setDateRange(undefined)
      return
    }

    // Use the exact dates selected by the user
    setDateRange({
      from: newDateRange.from,
      to: newDateRange.to
    })
  }, [])

  const handleAddTransaction = useCallback(async () => {
    setIsAddTransactionOpen(true)
  }, [])

  const handleAddSuccess = useCallback(async () => {
    try {
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

        // Also refresh upcoming transactions
        const upcoming = await transactionService.getUpcomingTransactions(user.id, 3)
        setUpcomingTransactions(upcoming || [])
      }
    } catch (error) {
      console.error("Error refreshing transactions:", error)
      toast.error("Failed to refresh transactions")
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
              onDelete={handleDeleteRecurringTransaction}
              onEdit={(id, data) => handleTableEdit(id, data)}
            />
          </CardContent>
        </div>

        {/* Upcoming Transactions Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Upcoming Transactions</h2>

          <CardContent className="p-0">
            <TransactionsTable
              loading={loading}
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
                updated_at: transaction.updated_at,
                // Add the recurring_transaction_id to link back to the parent recurring transaction
                recurring_transaction_id: transaction.recurring_transaction_id
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
              onDelete={handleDeleteRecurringTransaction}
              onEdit={(id, data) => handleTableEdit(id, data)}
            />
          </CardContent>
        </div>
      </div>

      <RecurringTransactionDialog
        isOpen={isAddTransactionOpen}
        onClose={() => setIsAddTransactionOpen(false)}
        onSubmit={handleAddSuccess}
        mode="create"
      />

      {/* Edit Recurring Transaction Dialog */}
      <RecurringTransactionDialog
        isOpen={isEditRecurringTransactionOpen}
        onClose={() => {
          setIsEditRecurringTransactionOpen(false);
          setEditingRecurringTransaction(null);
        }}
        onSubmit={(formData: any) => {
          if (user && editingRecurringTransaction?.id) {
            // Convert form data to RecurringTransaction type
            const transaction: RecurringTransaction = {
              id: editingRecurringTransaction.id,
              user_id: user.id,
              name: formData.name,
              amount: formData.amount,
              type: formData.type,
              account_type: formData.account_type,
              category_id: Number(formData.category_id),
              description: formData.description || '',
              start_date: formData.start_date instanceof Date ? formData.start_date.toISOString() : formData.start_date,
              end_date: formData.end_date instanceof Date ? formData.end_date.toISOString() : formData.end_date,
              frequency: formData.frequency,
              created_at: editingRecurringTransaction.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            handleEditSuccess(transaction);
          }
        }}
        initialData={editingRecurringTransaction}
        mode="edit"
      />
      {user && <TransactionConverter userId={user.id} />}
    </div>
  )
}
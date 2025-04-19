"use client"

import React, { useState, useCallback, useEffect, Suspense } from 'react'
import { Button } from "@/components/ui/button"
import { Plus, Menu } from 'lucide-react'
import { toast } from "sonner"

import { DateRangePickerWithRange } from '@/components/app/date-range-picker'
import { RecurringTransactionDialog } from '@/components/app/transaction-dialogs/recurring-transactions/recurring-transaction-dialog'
import { TransactionsTable } from '@/components/app/tables/transactions-table'
import { DateRange } from "react-day-picker"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Transaction, RecurringTransaction, TransactionType, AccountType } from "@/app/types/transaction"
import { Skeleton } from "@/components/ui/skeleton"

// Dynamic imports for heavy chart components
const PieDonutChart = React.lazy(() => import("@/components/app/charts/pie-donut-chart"))
const TransactionChart = React.lazy(() => import("@/components/app/charts/bar-chart-interactive"))
import { UpcomingTransactionsTable } from '@/components/app/upcoming-transactions/upcoming-transactions-table'

// Chart wrapper component to handle lazy loading with error boundary
function ChartWrapper({ children }: { children: React.ReactNode }) {
  return (
    <React.Suspense fallback={<div className="h-[300px] flex items-center justify-center"><p className="text-muted-foreground">Loading chart...</p></div>}>
      {children}
    </React.Suspense>
  )
}
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/utils/supabase/client"

// Redux imports
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { 
  fetchRecurringTransactions, 
  fetchUpcomingTransactions,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction
} from '@/redux/slices/recurringTransactionsSlice'
import { setDateRange } from '@/redux/slices/uiSlice'

export default function RecurringTransactionsPage() {
  // Redux state and dispatch
  const dispatch = useAppDispatch()
  const { items: recurringTransactions, status: recurringStatus } = useAppSelector((state: any) => state.recurringTransactions)
  const { upcomingTransactions, upcomingStatus } = useAppSelector((state: any) => state.recurringTransactions)
  const { dateRange: reduxDateRange } = useAppSelector((state: any) => state.ui)
  
  // Determine loading states
  const loading = recurringStatus === 'loading' || recurringStatus === 'idle'
  
  // Local state
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const [isEditRecurringTransactionOpen, setIsEditRecurringTransactionOpen] = useState(false)
  const [editingRecurringTransaction, setEditingRecurringTransaction] = useState<RecurringTransaction | null>(null)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()
  
  // Determine loading state from Redux
  const loading = recurringStatus === 'loading' || recurringStatus === 'idle' || upcomingStatus === 'loading'

  // Redux action dispatchers
  const loadRecurringTransactions = useCallback(() => {
    if (user?.id) {
      dispatch(fetchRecurringTransactions(user.id))
    }
  }, [dispatch, user])
  
  const loadUpcomingTransactions = useCallback(() => {
    if (user?.id) {
      dispatch(fetchUpcomingTransactions(user.id))
    }
  }, [dispatch, user])

  // Handle edit and delete functions using Redux
  const handleEditSuccess = useCallback(async (transaction: RecurringTransaction) => {
    try {
      if (!user || !transaction.id) return;
      
      // Dispatch the update action
      await dispatch(updateRecurringTransaction({ 
        id: transaction.id, 
        data: transaction,
        userId: user.id
      })).unwrap();
      
      toast.success("Transaction updated successfully");
      // Refresh upcoming transactions after update
      dispatch(fetchUpcomingTransactions(user.id));
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast.error("Failed to update transaction");
    }
  }, [user, dispatch]);
  
  const handleDeleteRecurringTransaction = useCallback(async (id: number) => {
    try {
      if (!user) return;
      
      // Dispatch the delete action
      await dispatch(deleteRecurringTransaction({ 
        id, 
        userId: user.id 
      })).unwrap();
      
      toast.success("Transaction deleted successfully");
      // Refresh upcoming transactions after delete
      dispatch(fetchUpcomingTransactions(user.id));
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Failed to delete transaction");
    }
  }, [user, dispatch]);

  // Handle table edit and delete
  const handleTableEdit = useCallback((id: number, data: Partial<Transaction>) => {
    if (!user) return;
    
    // For upcoming transactions, we need to get the recurring transaction ID
    const recurringId = data.recurring_transaction_id || id;
    
    // Find the recurring transaction
    const recurringTransaction = recurringTransactions.find((rt: any) => rt.id === recurringId);
    
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
    const fetchUserAndInitializeData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          toast.error("Authentication required", {
            description: "Please sign in to view recurring transactions.",
          })
          return
        }

        setUser(user)

        // Dispatch Redux actions to fetch data
        dispatch(fetchRecurringTransactions(user.id))
        dispatch(fetchUpcomingTransactions(user.id))
      } catch (error) {
        console.error("Error fetching user:", error)
        toast.error("Failed to load user data")
      }
    }

    fetchUserAndInitializeData()
  }, [dispatch])

  const handleDateRangeChange = useCallback((newDateRange: DateRange | undefined) => {
    if (!newDateRange || !newDateRange.from) {
      dispatch(setDateRange(null as any))
      return
    }

    // Use the exact dates selected by the user and dispatch to Redux
    dispatch(setDateRange({
      from: newDateRange.from.toISOString(),
      to: newDateRange.to ? newDateRange.to.toISOString() : null
    } as any))
  }, [dispatch])

  const handleAddTransaction = useCallback(async () => {
    setIsAddTransactionOpen(true)
  }, [])

  const handleAddSuccess = useCallback(async (formData: any) => {
    try {
      if (!user) return;
      
      // Dispatch the create action
      await dispatch(createRecurringTransaction({
        ...formData,
        user_id: user.id
      })).unwrap();
      
      toast.success("Recurring transaction created", {
        description: "Your recurring transaction has been successfully created.",
      })

      // Refresh upcoming transactions
      dispatch(fetchUpcomingTransactions(user.id))
    } catch (error) {
      console.error("Error creating transaction:", error)
      toast.error("Failed to create transaction")
    }
  }, [user, dispatch])

  return (
    <div className="h-full flex flex-col">
      <div className="container h-full flex flex-col mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold">Recurring Transactions</h1>
          <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
            <DateRangePickerWithRange dateRange={reduxDateRange} onDateRangeChange={handleDateRangeChange} />
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
              </CardHeader>
              <CardContent>
                <ChartWrapper>
                  <TransactionChart 
                      transactions={upcomingTransactions.map((ut: any) => {
                        // Find the corresponding recurring transaction to get type
                        const recurringTx = recurringTransactions.find((rt: any) => 
                          rt.id === ut.recurring_transaction_id
                        );
                        
                        // Ensure date is a valid date string
                        let formattedDate = ut.date;
                        try {
                          // Validate the date - if it's not a valid date string, format it
                          const dateObj = new Date(ut.date);
                          if (!isNaN(dateObj.getTime())) {
                            // It's a valid date, ensure it's in ISO format
                            formattedDate = dateObj.toISOString().split('T')[0];
                          }
                        } catch (error) {
                          console.error('Invalid date value:', ut.date);
                          // If date is invalid, use current date as fallback
                          formattedDate = new Date().toISOString().split('T')[0];
                        }
                        
                        return {
                          id: typeof ut.id === 'number' ? ut.id : parseInt(String(ut.id)),
                          user_id: String(ut.user_id),
                          date: formattedDate,
                          amount: ut.amount,
                          name: `${ut.category_name || 'Payment'}`,
                          description: '',
                          type: recurringTx?.type || 'Expense', // Use parent transaction type if available
                          account_type: recurringTx?.account_type || 'Checking',
                          category_id: ut.category_id,
                          category_name: ut.category_name
                        };
                      }) || []}
                      metrics={[
                        { key: "income", label: "Income", color: "hsl(var(--chart-1))" },
                        { key: "expense", label: "Expense", color: "hsl(var(--chart-2))" }
                      ]}
                      chartType="bar"
                    />
                  </ChartWrapper>
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
              data={recurringTransactions.map((rt: any) => {
                // Extract category name from the joined categories data
                const categoryName = rt.categories?.name || '';

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
              dateRange={reduxDateRange as DateRange | undefined}
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
              <UpcomingTransactionsTable limit={10} />
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
        initialData={editingRecurringTransaction as any}
        mode="edit"
      />
    </div>
  )
}
'use client'

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { Button } from "@/components/ui/button"
import { Upload, Plus, Menu } from 'lucide-react'
import { MetricsCards } from "@/components/app/metrics-cards"
import { TransactionsTable } from "@/components/app/tables/transactions-table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// Dynamic imports for heavy chart components
const SpendingChart = React.lazy(() => import("@/components/app/charts/bar-chart-multiple"))
const PieDonutChart = React.lazy(() => import("@/components/app/charts/pie-donut-chart"))
const TransactionChart = React.lazy(() => import("@/components/app/charts/bar-chart-interactive"))
const NetBalanceChart = React.lazy(() => import("@/components/app/charts/line-chart"))

import { DateRange } from "react-day-picker"
import { startOfMonth, endOfMonth, format, isFirstDayOfMonth } from "date-fns"

// Chart wrapper component to handle lazy loading with error boundary
function ChartWrapper({ children }: { children: React.ReactNode }) {
  return (
    <React.Suspense fallback={<div className="h-[300px] flex items-center justify-center"><p className="text-muted-foreground">Loading chart...</p></div>}>
      {children}
    </React.Suspense>
  )
}
import { useAuth } from '@/context/auth-context'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import { Transaction, UpdateTransaction } from '@/app/types/transaction'
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
import { useTransactions } from '@/hooks/use-transactions'

// Define default date range outside the component
const defaultDateRange = {
  from: startOfMonth(new Date()),
  to: endOfMonth(new Date())
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const [isUploadFileOpen, setIsUploadFileOpen] = useState(false)
  const [isBalanceDialogOpen, setIsBalanceDialogOpen] = useState(false)
  const [isEditingBalance, setIsEditingBalance] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultDateRange)
  const { transactions: transactionsList, loading: isLoading, error, refresh: refreshTransactions } = useTransactions(dateRange)
  const [processingDueTransactions, setProcessingDueTransactions] = useState(false)

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

    }
  }, [])

  // Process any due recurring transactions and convert them to actual transactions
  useEffect(() => {
    const generateDueTransactions = async () => {
      if (!user) return;
      
      try {
        setProcessingDueTransactions(true);

        
        // Generate transactions from any due recurring transactions
        const generatedTransactions = await transactionService.generateDueTransactions(user.id);
        
        if (generatedTransactions && generatedTransactions.length > 0) {

          toast.success(`${generatedTransactions.length} transaction(s) generated from recurring schedules`);
          
          // Refresh the transactions list to include the newly created transactions
          refreshTransactions();
        } else {

        }
      } catch (error) {
        console.error('Error generating due transactions:', error);
        toast.error('Failed to process recurring transactions');
      } finally {
        setProcessingDueTransactions(false);
      }
    };
    
    generateDueTransactions();
  }, [user, refreshTransactions]);

  const handleDateChange = useCallback((date: Date) => {
    setSelectedDate(date)
  }, [])

  const isAddBalanceVisible = isFirstDayOfMonth(new Date()) // This is a simplified check. You might want to implement more sophisticated logic.

  const handleTransactionSubmit = async (data: any) => {
    try {
      if (!user) {
        console.error("User not authenticated");
        return;
      }

      if (data.transactionType === "regular") {
        // Prepare the transaction data with user_id
        const transactionData = {
          ...data,
          user_id: user.id
        };
        await transactionService.createTransaction(transactionData);
      } else {
        // Use the createCombinedTransaction method which takes userId as a separate parameter
        await transactionService.createCombinedTransaction(data, user.id);
      }

    } catch (error) {
      console.error("Failed to create transaction:", error);
    }
  }

  const handleDeleteTransaction = useCallback(async (id: number) => {
    if (!user?.id) {
      toast.error('Authentication required')
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      toast.success('Transaction deleted successfully')
    } catch (error) {
      console.error('Error deleting transaction:', error)
      toast.error('Failed to delete transaction')
    }
  }, [user])

  const handleBulkDelete = useCallback(async (ids: number[]) => {
    if (!user?.id) {
      toast.error('Authentication required')
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('transactions')
        .delete()
        .in('id', ids)
        .eq('user_id', user.id)

      if (error) throw error
      toast.success('Transactions deleted successfully')
    } catch (error) {
      console.error('Error deleting transactions:', error)
      toast.error('Failed to delete transactions')
    }
  }, [user])

  const handleEditTransaction = useCallback(async (id: number, formData: Partial<UpdateTransaction>) => {
    if (!user?.id) {
      toast.error('Authentication required')
      return
    }

    try {
      // Format the date if it's a Date object
      const formattedData = {
        ...formData,
        date: formData.date instanceof Date ? format(formData.date, 'yyyy-MM-dd') : formData.date
      };
      
      const supabase = createClient()
      const { error } = await supabase
        .from('transactions')
        .update(formattedData)
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      toast.success('Transaction updated successfully')
    } catch (error) {
      console.error('Error updating transaction:', error)
      toast.error('Failed to update transaction')
    }
  }, [user])

  const handleBulkEdit = useCallback(async (ids: number[], changes: Partial<UpdateTransaction>) => {
    if (!user?.id) {
      toast.error('Authentication required')
      return
    }

    try {
      // Format dates in the changes object if needed
      const formattedChanges = {
        ...changes,
        date: changes.date instanceof Date ? format(changes.date, 'yyyy-MM-dd') : changes.date
      };
      
      const supabase = createClient()
      const { error } = await supabase
        .from('transactions')
        .update(formattedChanges)
        .in('id', ids)
        .eq('user_id', user.id)

      if (error) throw error
      toast.success('Transactions updated successfully')
    } catch (error) {
      console.error('Error updating transactions:', error)
      toast.error('Failed to update transactions')
    }
  }, [user])

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
              <Card className="border-none shadow-none bg-transparent">
                <CardContent>
                  <ChartWrapper>
                    <TransactionChart />
                  </ChartWrapper>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="border-none shadow-none bg-transparent">
                <CardContent>
                  <ChartWrapper>
                    <NetBalanceChart />
                  </ChartWrapper>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="border-none shadow-none bg-transparent">
                <CardContent>
                  <ChartWrapper>
                    <SpendingChart />
                  </ChartWrapper>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="border-none shadow-none bg-transparent">
                <CardContent>
                  <ChartWrapper>
                    <PieDonutChart />
                  </ChartWrapper>
                </CardContent>
              </Card>
            </div>
          </div>

          <TransactionsTable
            data={transactionsList}
            loading={isLoading}
            showFilters={false}
            showPagination={true}
            showRowsCount={true}
            itemsPerPage={5}
            sortBy={{
              field: "date",
              order: "desc"
            }}
            onDelete={handleDeleteTransaction}
            onBulkDelete={handleBulkDelete}
            onEdit={handleEditTransaction}
            onBulkEdit={handleBulkEdit}
          />
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

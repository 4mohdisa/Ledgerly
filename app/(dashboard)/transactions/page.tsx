"use client"

import React, { useState, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Plus, Menu } from 'lucide-react'
import { TransactionsTable } from "@/components/app/tables/transactions-table"
import { DateRangePickerWithRange } from '@/components/app/date-range-picker'
import { TransactionDialog } from '@/components/app/transaction-dialogs/transactions/transaction-dialog'
import { DateRange } from "react-day-picker"
import { startOfMonth, endOfMonth } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTransactions } from '@/hooks/use-transactions'
import { useAuth } from '@/context/auth-context'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import { UpdateTransaction } from '@/app/types/transaction'

export default function TransactionsPage() {
  const { user } = useAuth()
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  })
  const { transactions: transactionsList, loading, error, refresh } = useTransactions(dateRange)

  const handleAddTransaction = useCallback(() => {
    setIsAddTransactionOpen(true)
  }, [])

  const handleDateRangeChange = useCallback((newDateRange: DateRange | undefined) => {
    if (!newDateRange) {
      // If date range is cleared, show all transactions from the current month
      setDateRange(undefined)
      return
    }
    
    // Use the exact dates selected by the user
    setDateRange({
      from: newDateRange.from,
      to: newDateRange.to || newDateRange.from
    })
  }, [])

  const handleTransactionSubmit = useCallback(async () => {
    // Transaction is created through the dialog and will be fetched automatically
    setIsAddTransactionOpen(false)
    // Refresh the transactions list after adding a new transaction
    refresh()
  }, [refresh])

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
      
      // Refresh the transactions list after deletion
      refresh()
      toast.success('Transaction deleted successfully')
    } catch (error) {
      console.error('Error deleting transaction:', error)
      toast.error('Failed to delete transaction')
    }
  }, [user, refresh])

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
      
      // Refresh the transactions list after bulk deletion
      refresh()
      toast.success('Transactions deleted successfully')
    } catch (error) {
      console.error('Error deleting transactions:', error)
      toast.error('Failed to delete transactions')
    }
  }, [user, refresh])

  const handleEditTransaction = useCallback(async (id: number, formData: Partial<UpdateTransaction>) => {
    if (!user?.id) {
      toast.error('Authentication required')
      return
    }

    try {
      console.log('Editing transaction:', id, formData)
      
      const supabaseData: Record<string, any> = {}
      
      // Process all fields in the form data
      Object.keys(formData).forEach(key => {
        if (key === 'date') {
          if (formData.date) {
            // Convert Date objects to ISO string format for Supabase
            supabaseData.date = formData.date instanceof Date 
              ? formData.date.toISOString() 
              : formData.date
          }
        } else {
          // Copy all other fields as-is
          supabaseData[key] = formData[key as keyof typeof formData]
        }
      })

      console.log('Prepared data for Supabase:', supabaseData)

      const supabase = createClient()
      const { error } = await supabase
        .from('transactions')
        .update(supabaseData)
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      
      // Refresh transactions list after successful update
      refresh()
      toast.success('Transaction updated successfully')
    } catch (error) {
      console.error('Error updating transaction:', error)
      toast.error('Failed to update transaction')
    }
  }, [user, refresh])

  const handleBulkEdit = useCallback(async (ids: number[], changes: Partial<UpdateTransaction>) => {
    if (!user?.id) {
      toast.error('Authentication required')
      return
    }

    try {
      const supabaseData: Record<string, any> = {}
      
      Object.keys(changes).forEach(key => {
        if (key === 'date') {
          if (changes.date) {
            supabaseData.date = changes.date instanceof Date 
              ? changes.date.toISOString() 
              : changes.date
          }
        } else {
          supabaseData[key] = changes[key as keyof typeof changes]
        }
      })

      const supabase = createClient()
      const { error } = await supabase
        .from('transactions')
        .update(supabaseData)
        .in('id', ids)
        .eq('user_id', user.id)

      if (error) throw error
      
      // Refresh the transactions list after bulk edit
      refresh()
      toast.success('Transactions updated successfully')
    } catch (error) {
      console.error('Error updating transactions:', error)
      toast.error('Failed to update transactions')
    }
  }, [user, refresh])

  return (
    <div className="h-full flex flex-col">
      <div className="container h-full flex flex-col mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold">Transactions</h1>
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

          {error && (
            <div className="mb-4 p-4 bg-destructive/15 text-destructive rounded-md">
              Failed to load transactions. Please try again.
            </div>
          )}

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
              loading={loading}
              onDelete={handleDeleteTransaction}
              onBulkDelete={handleBulkDelete}
              onEdit={handleEditTransaction}
              onBulkEdit={handleBulkEdit}
            />
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

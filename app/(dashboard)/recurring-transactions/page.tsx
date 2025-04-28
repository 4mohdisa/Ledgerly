"use client";

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Menu } from 'lucide-react';
import { toast } from "sonner";

import { DateRangePickerWithRange } from '@/components/app/date-range-picker';
import { RecurringTransactionDialog } from '@/components/app/transaction-dialogs/recurring-transactions/recurring-transaction-dialog';
import { TransactionsTable } from '@/components/app/tables/transactions-table';
import { DateRange } from "react-day-picker";
import { Transaction, RecurringTransaction } from "@/app/types/transaction";

// Import upcoming transactions table
import { UpcomingTransactionsTable } from '@/components/app/upcoming-transactions/upcoming-transactions-table';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/utils/supabase/client";

// Import transaction service
import { transactionService } from '@/app/services/transaction-services';

// Only keep fetchUpcomingTransactions from Redux
import { fetchUpcomingTransactions } from '@/redux/slices/recurringTransactionsSlice';

export default function RecurringTransactionsPage() {
  // Local state for transactions and UI
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [upcomingTransactions, setUpcomingTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setLocalDateRange] = useState<DateRange | undefined>();
  
  // Local state
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isEditRecurringTransactionOpen, setIsEditRecurringTransactionOpen] = useState(false);
  const [editingRecurringTransaction, setEditingRecurringTransaction] = useState<RecurringTransaction | null>(null);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  // Function to fetch recurring transactions data
  const fetchRecurringTransactionsData = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const data = await transactionService.getRecurringTransactions(user.id);
      setRecurringTransactions(data as RecurringTransaction[]);
    } catch (error) {
      console.error("Error fetching recurring transactions:", error);
      toast.error("Failed to load recurring transactions");
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  
  // Function to fetch upcoming transactions data
  const fetchUpcomingTransactionsData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // Need to cast to unknown first due to type mismatch between predicted transactions and Transaction type
      const data = await transactionService.predictUpcomingTransactions(user.id);
      setUpcomingTransactions(data as unknown as Transaction[]);
    } catch (error) {
      console.error("Error fetching upcoming transactions:", error);
      toast.error("Failed to load upcoming transactions");
    }
  }, [user]);

  // Handle add success
  const handleAddSuccess = useCallback(async (formData: any) => {
    if (!user) {
      toast.error("Authentication required");
      return Promise.reject("Authentication required");
    }
    
    try {
      // Use transaction service directly
      const submissionData = {
        ...formData,
        user_id: user.id,
        category_id: formData.category_id ? parseInt(formData.category_id, 10) : 1,
        start_date: formData.start_date,
        end_date: formData.end_date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // Create the recurring transaction using the service
      const result = await transactionService.createRecurringTransaction(submissionData);
      
      toast.success("Transaction created successfully");
      
      // Refresh data
      fetchRecurringTransactionsData();
      fetchUpcomingTransactionsData();
      
      return Promise.resolve();
    } catch (error) {
      console.error("Error creating transaction:", error);
      toast.error("Failed to create transaction");
      return Promise.reject(error);
    }
  }, [user, fetchRecurringTransactionsData, fetchUpcomingTransactionsData]);

  // Handle edit success using transaction service
  const handleEditSuccess = useCallback(async (transaction: RecurringTransaction) => {
    if (!user || !transaction.id) {
      toast.error("Cannot update transaction: Missing user or transaction ID");
      return Promise.reject("Missing user or transaction ID");
    }
    
    // Clean up the transaction object - only include fields we want to update
    const cleanTransaction = {
      name: transaction.name,
      amount: transaction.amount,
      type: transaction.type,
      account_type: transaction.account_type,
      category_id: Number(transaction.category_id),
      description: transaction.description || '',
      frequency: transaction.frequency,
      start_date: transaction.start_date,
      end_date: transaction.end_date,
      updated_at: new Date().toISOString()
    };
    
    // Show loading toast
    toast.loading("Updating transaction...");
    
    try {
      console.log('Updating recurring transaction with service:', { 
        id: transaction.id, 
        data: cleanTransaction, 
        userId: user.id 
      });
      
      // Use transaction service
      const updatedTransaction = await transactionService.updateRecurringTransaction(
        transaction.id as number,
        cleanTransaction,
        user.id
      );
      
      console.log('Update successful:', updatedTransaction);
      
      // Dismiss loading toast and show success
      toast.dismiss();
      toast.success("Transaction updated successfully");
      
      // Refresh data
      fetchRecurringTransactionsData();
      fetchUpcomingTransactionsData();
      
      return Promise.resolve();
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast.dismiss(); // Dismiss loading toast
      toast.error("Failed to update transaction");
      throw error; // Re-throw to let the dialog component handle it
    }
  }, [user]);

  const handleDeleteRecurringTransaction = useCallback(async (id: number) => {
    try {
      if (!user) return;
      
      // Use transaction service directly
      await transactionService.deleteRecurringTransaction(id, user.id);
      
      toast.success("Transaction deleted successfully");
      
      // Refresh data after delete
      fetchRecurringTransactionsData();
      fetchUpcomingTransactionsData();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Failed to delete transaction");
    }
  }, [user]);

  // Handle table edit and delete
  const handleTableEdit = useCallback((id: number, data: Partial<Transaction>) => {
    if (!user) return;
    
    // For upcoming transactions, we need to get the recurring transaction ID
    const recurringId = data.recurring_transaction_id || id;
    
    // Find the recurring transaction
    const recurringTransaction = recurringTransactions.find((rt: any) => rt.id === recurringId);
    
    if (recurringTransaction) {
      // Instead of directly calling handleEditSuccess, open the edit dialog with the transaction data
      setEditingRecurringTransaction(recurringTransaction);
      setIsEditRecurringTransactionOpen(true);
    } else {
      toast.error("Could not find the recurring transaction");
    }
  }, [user, recurringTransactions]);

  useEffect(() => {
    const fetchUserAndInitializeData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          toast.error("Authentication required", {
            description: "Please sign in to view recurring transactions.",
          });
          return;
        }

        setUser(user);

        // Fetch data using our functions
        fetchRecurringTransactionsData();
        fetchUpcomingTransactionsData();
      } catch (error) {
        console.error("Error fetching user:", error);
        toast.error("Failed to load user data");
      }
    };

    fetchUserAndInitializeData();
  }, [supabase.auth]);

  const handleDateRangeChange = useCallback((newDateRange: DateRange | undefined) => {
    if (!newDateRange || !newDateRange.from) {
      setLocalDateRange(undefined);
      return;
    }

    const range: DateRange = {
      from: newDateRange.from,
      to: newDateRange.to || newDateRange.from
    };
    
    setLocalDateRange(range);
    fetchUpcomingTransactionsData();
  }, [fetchUpcomingTransactionsData]);

  const handleAddTransaction = useCallback(async () => {
    setIsAddTransactionOpen(true);
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="container h-full flex flex-col mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
        {/* Spacer for layout consistency */}
        <div className="mb-4"></div>
        {/* Recurring Transactions Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Active Recurring Transactions</h2>
            <TransactionsTable
              loading={isLoading}
              data={recurringTransactions.map((rt: any) => {
                // Extract category name from the joined categories data
                const categoryName = rt.categories?.name || '';

                return {
                  id: rt.id?.toString() || '', // Convert ID to string and handle undefined case
                  user_id: rt.user_id?.toString() || '', // Also convert user_id to string
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
                };
              }) as any}
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
        </div>

        {/* Upcoming Transactions Section */}
        <div>
            <h2 className="text-xl font-semibold mb-4">Upcoming Transactions</h2> 
            <UpcomingTransactionsTable limit={10} />
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
        onSubmit={async (formData) => {
          if (!user || !editingRecurringTransaction?.id) {
            console.error('Missing user or transaction ID');
            toast.error('Cannot update: Missing required information');
            return;
          }
          
          try {
            console.log('Processing edit submission:', formData);
            
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
              // Ensure dates are properly formatted
              start_date: formData.start_date instanceof Date ? formData.start_date.toISOString() : formData.start_date,
              end_date: formData.end_date instanceof Date ? formData.end_date.toISOString() : formData.end_date,
              frequency: formData.frequency,
              created_at: editingRecurringTransaction.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            // Wait for the update to complete
            await handleEditSuccess(transaction);
            
            // Only close the dialog after successful update
            setIsEditRecurringTransactionOpen(false);
            setEditingRecurringTransaction(null);
          } catch (error) {
            console.error('Error updating transaction:', error);
            // Error is already handled in handleEditSuccess
            // We don't close the dialog on error
            throw error; // Re-throw to let the dialog component handle it
          }
        }}
        initialData={editingRecurringTransaction as any}
        mode="edit"
      />
    </div>
  )
}
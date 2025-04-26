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

// Redux imports
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { 
  fetchRecurringTransactions, 
  fetchUpcomingTransactions,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction
} from '@/redux/slices/recurringTransactionsSlice';
import { setDateRange } from '@/redux/slices/uiSlice';

export default function RecurringTransactionsPage() {
  // Redux state and dispatch
  const dispatch = useAppDispatch();
  const { items: recurringTransactions, status: recurringStatus } = useAppSelector((state: any) => state.recurringTransactions);
  const { upcomingTransactions, upcomingStatus } = useAppSelector((state: any) => state.recurringTransactions);
  const { dateRange: reduxDateRange } = useAppSelector((state: any) => state.ui);
  
  // Local state
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isEditRecurringTransactionOpen, setIsEditRecurringTransactionOpen] = useState(false);
  const [editingRecurringTransaction, setEditingRecurringTransaction] = useState<RecurringTransaction | null>(null);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();
  
  // Determine loading state from Redux
  const loading = recurringStatus === 'loading' || recurringStatus === 'idle' || upcomingStatus === 'loading';

  // Refresh upcoming transactions when recurring transactions change
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchUpcomingTransactions(user.id));
    }
  }, [dispatch, user]);
  
  const loadUpcomingTransactions = useCallback(() => {
    if (user?.id) {
      dispatch(fetchUpcomingTransactions(user.id));
    }
  }, [dispatch, user]);

  // Redux action dispatchers
  const loadRecurringTransactions = useCallback(() => {
    if (user?.id) {
      dispatch(fetchRecurringTransactions(user.id));
    }
  }, [dispatch, user]);

  // Handle edit and delete functions using Redux
  const handleEditSuccess = useCallback(async (transaction: RecurringTransaction): Promise<void> => {
    if (!user || !transaction.id) {
      toast.error("Cannot update transaction: Missing user or transaction ID");
      return Promise.reject(new Error("Missing user or transaction ID"));
    }
    
    console.log('Updating transaction:', transaction);
    
    // Ensure we have a clean transaction object without any extra properties
    // We'll omit user_id from the update data since it's a UUID and only used for filtering
    // This prevents type conversion errors in Supabase
    const cleanTransaction: Omit<RecurringTransaction, 'user_id'> = {
      id: transaction.id,
      name: transaction.name,
      amount: transaction.amount,
      type: transaction.type,
      account_type: transaction.account_type,
      category_id: Number(transaction.category_id),
      description: transaction.description || '',
      frequency: transaction.frequency,
      start_date: transaction.start_date,
      end_date: transaction.end_date,
      created_at: transaction.created_at,
      updated_at: new Date().toISOString()
    };
    
    // Show loading toast
    toast.loading("Updating transaction...");
    
    try {
      // Dispatch the update action
      const updateAction = dispatch(updateRecurringTransaction({ 
        id: transaction.id, 
        data: cleanTransaction,
        userId: user.id
      }));
      
      const result = await updateAction.unwrap();
      
      console.log('Update result:', result);
      
      // Dismiss loading toast and show success
      toast.dismiss();
      toast.success("Transaction updated successfully");
      
      // Refresh data
      dispatch(fetchUpcomingTransactions(user.id));
      dispatch(fetchRecurringTransactions(user.id));
      
      return Promise.resolve();
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast.dismiss(); // Dismiss any loading toast
      toast.error(typeof error === 'string' ? error : "Failed to update transaction");
      return Promise.reject(error);
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

        // Dispatch Redux actions to fetch data
        dispatch(fetchRecurringTransactions(user.id));
        dispatch(fetchUpcomingTransactions(user.id));
      } catch (error) {
        console.error("Error fetching user:", error);
        toast.error("Failed to load user data");
      }
    };

    fetchUserAndInitializeData();
  }, [dispatch]);

  const handleDateRangeChange = useCallback((newDateRange: DateRange | undefined) => {
    if (!newDateRange || !newDateRange.from) {
      dispatch(setDateRange(null as any));
      return;
    }

    // Use the exact dates selected by the user and dispatch to Redux
    dispatch(setDateRange({
      from: newDateRange.from.toISOString(),
      to: newDateRange.to ? newDateRange.to.toISOString() : null
    } as any));
  }, [dispatch]);

  const handleAddTransaction = useCallback(async () => {
    setIsAddTransactionOpen(true);
  }, []);

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
      });

      // Refresh upcoming transactions
      dispatch(fetchUpcomingTransactions(user.id));
    } catch (error) {
      console.error("Error creating transaction:", error);
      toast.error("Failed to create transaction");
    }
  }, [user, dispatch]);

  return (
    <div className="h-full flex flex-col">
      <div className="container h-full flex flex-col mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
        {/* Spacer for layout consistency */}
        <div className="mb-4"></div>
        {/* Recurring Transactions Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Active Recurring Transactions</h2>
            <TransactionsTable
              loading={loading}
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
              dateRange={reduxDateRange as DateRange | undefined}
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
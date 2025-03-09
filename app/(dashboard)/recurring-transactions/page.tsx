"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Transaction, TransactionFormData, FrequencyType } from "@/app/types/transaction";
import { transactionService } from "@/app/services/transaction-services";
import { createClient } from "@/utils/supabase/client";
import { useCategories } from "@/hooks/use-categories";
import { accountTypes } from "@/data/account-types";
import { transactionTypes } from "@/data/transactiontypes";
import { frequencies, recurringFrequencyData } from "@/data/frequencies";

interface TransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => void;
  transaction?: Transaction;
  mode: "create" | "edit";
}

// Create a schema for form validation
const transactionSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  amount: z.coerce.number().positive({ message: "Amount must be positive" }),
  type: z.string(),
  account_type: z.string(),
  category_id: z.coerce.number(),
  description: z.string().optional(),
  date: z.date(),
  schedule_type: z.string().default("Never"),
  start_date: z.date().optional().nullable(),
  end_date: z.date().optional().nullable(),
});

function TransactionDialog({ isOpen, onClose, onSubmit, transaction, mode = "create" }: TransactionDialogProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { categories, loading: categoriesLoading } = useCategories();

  // Initialize form with default values or transaction data for editing
  const form = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      name: transaction?.name || "",
      amount: transaction?.amount || 0,
      type: transaction?.type || "Expense",
      account_type: transaction?.account_type || "Cash",
      category_id: transaction?.category_id || 1,
      description: transaction?.description || "",
      date: transaction?.date ? new Date(transaction.date) : new Date(),
      schedule_type: transaction?.recurring_frequency || "Never",
      start_date: transaction?.start_date ? new Date(transaction.start_date) : null,
      end_date: transaction?.end_date ? new Date(transaction.end_date) : null,
    },
  });

  // Get the current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    getCurrentUser();
  }, [supabase.auth]);

  const handleFormSubmit = async (data: z.infer<typeof transactionSchema>) => {
    setLoading(true);
    try {
      // Transform the form data to match the TransactionFormData interface
      const formData: TransactionFormData = {
        name: data.name,
        amount: data.amount,
        type: data.type,
        account_type: data.account_type,
        category_id: data.category_id,
        description: data.description || null,
        date: data.date,
        schedule_type: data.schedule_type as FrequencyType,
        start_date: data.start_date,
        end_date: data.end_date,
      };

      // Submit the form data
      await onSubmit(formData);
      form.reset();
    } catch (error) {
      console.error("Error submitting transaction:", error);
      toast.error("Failed to save transaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add New Transaction" : "Edit Transaction"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new transaction to track your finances."
              : "Update the details of your transaction."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Transaction Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Groceries, Salary, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Amount */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Transaction Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {transactionTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Account Type */}
              <FormField
                control={form.control}
                name="account_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accountTypes.map((account) => (
                          <SelectItem key={account.value} value={account.value}>
                            {account.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Transaction Date */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Recurring Schedule */}
              <FormField
                control={form.control}
                name="schedule_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recurring Schedule</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {recurringFrequencyData.map((frequency) => (
                          <SelectItem key={frequency.value} value={frequency.value}>
                            {frequency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Conditional fields for recurring transactions */}
              {form.watch("schedule_type") !== "Never" && (
                <>
                  {/* Start Date */}
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* End Date */}
                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date (Optional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? format(field.value, "PPP") : <span>No end date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter additional details about this transaction"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : mode === "create" ? "Add Transaction" : "Update Transaction"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function RecurringTransactionsPage() {
  const supabase = createClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    getCurrentUser();
  }, [supabase.auth]);

  useEffect(() => {
    if (user) {
      fetchRecurringTransactions();
    }
  }, [user]);

  const fetchRecurringTransactions = async () => {
    setLoading(true);
    try {
      const transactions = await transactionService.getRecurringTransactions(user.id);
      setTransactions(transactions);
    } catch (error) {
      console.error('Error fetching recurring transactions:', error);
      toast.error('Failed to load recurring transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (mode: 'create' | 'edit' = 'create', transaction?: any) => {
    setDialogMode(mode);
    setSelectedTransaction(transaction);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedTransaction(null);
  };

  const handleSubmit = async (data: TransactionFormData) => {
    try {
      if (dialogMode === 'create') {
        // Format dates for API compatibility
        const formattedData = {
          ...data,
          user_id: user.id,
          frequency: data.schedule_type,
          // start_date is required and can't be null
          start_date: data.start_date ? format(data.start_date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
          // end_date is optional and can be null
          end_date: data.end_date ? format(data.end_date, 'yyyy-MM-dd') : undefined,
          date: format(data.date, 'yyyy-MM-dd')
        };
        
        await transactionService.createRecurringTransaction(formattedData);
        toast.success('Recurring transaction created');
      } else {
        // Format dates for API compatibility
        const formattedData = {
          ...data,
          frequency: data.schedule_type,
          start_date: data.start_date ? format(data.start_date, 'yyyy-MM-dd') : undefined,
          end_date: data.end_date ? format(data.end_date, 'yyyy-MM-dd') : undefined
        };
        
        await transactionService.updateRecurringTransaction(
          selectedTransaction.id,
          formattedData,
          user.id
        );
        toast.success('Recurring transaction updated');
      }
      fetchRecurringTransactions();
      handleCloseDialog();
    } catch (error) {
      console.error('Error submitting transaction:', error);
      toast.error('Failed to save recurring transaction');
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    try {
      await transactionService.deleteRecurringTransaction(id, user.id);
      toast.success('Recurring transaction deleted');
      fetchRecurringTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete recurring transaction');
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Recurring Transactions</h1>
        <Button onClick={() => handleOpenDialog('create')}>Add New</Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading transactions...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No recurring transactions found</p>
          <Button className="mt-4" onClick={() => handleOpenDialog('create')}>
            Create Your First Recurring Transaction
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Amount</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Frequency</th>
                <th className="text-left p-3">Category</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{transaction.name}</td>
                  <td className="p-3">${parseFloat(transaction.amount).toFixed(2)}</td>
                  <td className="p-3">{transaction.type}</td>
                  <td className="p-3">{transaction.recurring_frequency}</td>
                  <td className="p-3">{transaction.categories?.name || 'Uncategorized'}</td>
                  <td className="p-3 flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog('edit', transaction)}>
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteTransaction(transaction.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TransactionDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        transaction={selectedTransaction}
        mode={dialogMode}
      />
    </div>
  );
}
"use client"

import React, { useState, useEffect } from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { format } from "date-fns"
import { CalendarIcon } from 'lucide-react'

import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

import { transactionTypes, TransactionType } from "@/data/transactiontypes"
import { frequencies, FrequencyType } from "@/data/frequencies"
import { useCategories } from "@/hooks/use-categories"
import { accountTypes, AccountType } from "@/data/account-types"
import { transactionService } from '@/app/services/transaction-services'
import { BaseDialogProps, TransactionFormValues, transactionSchema } from '../shared/schema'
import { useAuth } from '@/context/auth-context'

interface TransactionDialogProps extends Omit<BaseDialogProps, 'mode'> {
  initialData?: Partial<TransactionFormValues>;
  mode: 'create' | 'edit';
  onSubmit?: (data: TransactionFormValues) => void;
}

export function TransactionDialog({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode = 'create'
}: TransactionDialogProps) {
  const { user } = useAuth()
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories()
  console.log('TransactionDialog - categories:', { categories, loading: categoriesLoading, error: categoriesError })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      name: "",
      description: "",
      amount: 0,
      type: "Expense" as TransactionType,
      account_type: "Cash" as AccountType,
      category_id: "",
      date: new Date() as Date,
      recurring_frequency: "Never" as FrequencyType,
      ...initialData,
    },
  })
  
  // Reset form when initialData changes or dialog opens
  useEffect(() => {
    if (isOpen && initialData) {
      console.log('Resetting form with initialData:', initialData)
      // Reset the form with the new values
      form.reset({
        name: "",
        description: "",
        amount: 0,
        type: "Expense" as TransactionType,
        account_type: "Cash" as AccountType,
        category_id: "",
        date: new Date() as Date,
        recurring_frequency: "Never" as FrequencyType,
        ...initialData,
      })
    }
  }, [form, initialData, isOpen])

  const handleSubmit = async (data: TransactionFormValues) => {
    if (!user?.id) {
      toast.error("Authentication required", {
        description: "Please sign in to create transactions.",
      })
      return
    }

    setIsSubmitting(true)

    try {
      if (categoriesLoading) {
        throw new Error('Categories are still loading. Please try again.')
      }

      if (categoriesError) {
        throw new Error('Failed to load categories. Please refresh the page.')
      }

      // Validate and log category selection
      const categoryId = Number(data.category_id)
      const selectedCategory = categories.find(cat => cat.id === categoryId)
      console.log('Category validation:', {
        categoryId,
        selectedCategory,
        allCategories: categories.map(c => ({ id: c.id, name: c.name }))
      })
      
      if (!selectedCategory) {
        throw new Error(`Category ${categoryId} not found. Please select a valid category.`)
      }

      const now = new Date().toISOString()
      let result;
      
      // Check if we're in edit mode - if so, we don't create a new transaction
      // Instead, we'll just pass the data to the parent component via onSubmit
      if (mode === 'edit') {
        console.log('Edit mode - passing data to parent component', data)
        // We don't need to do anything here - just pass the data to the parent
        // component which will handle the update
        result = { success: true }
      } else if (data.recurring_frequency !== 'Never') {
        // For recurring transactions, manually create both transaction and recurring transaction
        // First, create the regular transaction
        const transactionData = {
          name: data.name,
          amount: data.amount,
          type: data.type as TransactionType,
          account_type: data.account_type as AccountType,
          category_id: categoryId,
          description: data.description,
          date: data.date.toISOString(),
          created_at: now,
          updated_at: now,
          user_id: user.id,
          recurring_frequency: data.recurring_frequency as FrequencyType
        }
        
        // Create the transaction
        const { transaction } = await transactionService.createTransaction(transactionData)
        
        // Then create the recurring transaction
        const recurringData = {
          user_id: user.id,
          name: data.name,
          amount: data.amount,
          type: data.type as TransactionType,
          account_type: data.account_type as AccountType,
          category_id: categoryId,
          description: data.description,
          frequency: data.recurring_frequency as FrequencyType,
          start_date: data.date.toISOString(),
          end_date: null,
          created_at: now,
          updated_at: now
        }
        
        // Create the recurring transaction
        const recurringTransaction = await transactionService.createRecurringTransaction(recurringData)
        
        // Combine results
        result = { transaction, recurringTransaction }
      } else {
        // For one-time transactions, use createTransaction
        const transactionData = {
          name: data.name,
          amount: data.amount,
          type: data.type as TransactionType,
          account_type: data.account_type as AccountType,
          category_id: categoryId,
          description: data.description,
          date: data.date.toISOString(),
          created_at: now,
          updated_at: now,
          user_id: user.id,
          recurring_frequency: 'Never' as FrequencyType
        }
        
        result = await transactionService.createTransaction(transactionData)
      }

      if (result.transaction) {
        toast.success(`${mode === 'create' ? 'Created' : 'Updated'} transaction`, {
          description: `${data.name} - ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.amount)}`
        })
      }
      
      if (result.recurringTransaction) {
        const frequencyObj = frequencies.find(f => f.value === data.recurring_frequency);
        toast.success('Created recurring transaction', {
          description: `This transaction will repeat ${frequencyObj ? frequencyObj.label : data.recurring_frequency}`
        })
      }

      if (onSubmit) {
        onSubmit(data)
      }

      form.reset()
      onClose()
    } catch (error) {
      console.error('Failed to submit transaction:', error)
      let errorMessage = "Please try again."
      
      if (error instanceof Error) {
        if (error.message.includes('user_id')) {
          errorMessage = "Authentication required. Please sign in."
        } else if (error.message.includes('date')) {
          errorMessage = "Please select a valid date."
        } else if (error.message.includes('frequency')) {
          errorMessage = "Please select a valid recurring frequency."
        } else {
          errorMessage = error.message
        }
      }
      
      toast.error("Failed to save transaction", {
        description: errorMessage
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Transaction' : 'Edit Transaction'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add a new transaction to your records.'
              : 'Make changes to your transaction here.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Error Summary */}
            {Object.keys(form.formState.errors).length > 0 && (
              <div className="rounded-md bg-destructive/15 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-destructive">
                      Please correct the following errors:
                    </h3>
                    <div className="mt-2 text-sm text-destructive">
                      <ul className="list-disc space-y-1 pl-5">
                        {Object.entries(form.formState.errors).map(([key, value]) => (
                          <li key={key}>{value?.message?.toString() || 'Invalid field'}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Name and Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Transaction name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        {...field} 
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date, Type, and Account Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full h-10 px-3 text-left font-normal flex justify-between items-center"
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span className="text-muted-foreground">Pick a date</span>
                            )}
                            <CalendarIcon className="h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            if (date) {
                              field.onChange(date)
                              form.setValue('date', date)
                            }
                          }}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              <FormField
                control={form.control}
                name="account_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accountTypes.map((type) => (
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
            </div>

            {/* Category and Recurring Frequency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={String(category.id)}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recurring_frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schedule Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Never">One-time Transaction</SelectItem>
                        {frequencies.map((freq) => (
                          <SelectItem key={freq.value} value={freq.value}>
                            {freq.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* End Date field removed as requested */}

            {/* Description */}
            <div className="col-span-full">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional details..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Footer */}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </>
                ) : (
                  mode === 'create' ? 'Create Transaction' : 'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

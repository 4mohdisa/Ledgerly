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

import { transactionTypes } from "@/data/transactiontypes"
import { frequencies } from "@/data/frequencies"
import { categories } from "@/data/categories"
import { accountTypes } from "@/data/account-types"
import { transactionService } from '@/app/services/transaction-services'
import { RecurringTransaction, UpdateRecurringTransaction } from '@/app/types/transaction'
import { BaseDialogProps, RecurringTransactionFormValues, recurringTransactionSchema } from '../shared/schema'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import { TransactionType } from '@/data/transactiontypes'
import { AccountType } from '@/data/account-types'
import { FrequencyType } from '@/data/frequencies'

interface RecurringTransactionDialogProps extends Omit<BaseDialogProps, 'initialData'> {
  onSubmit?: (data: RecurringTransactionFormValues) => void
  initialData?: RecurringTransaction | null
}

function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Error fetching user:', error)
        return
      }
      setUser(session?.user ?? null)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  return { user }
}

export function RecurringTransactionDialog({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}: RecurringTransactionDialogProps) {
  const { user } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<RecurringTransactionFormValues>({
    resolver: zodResolver(recurringTransactionSchema),
    defaultValues: {
      name: "",
      description: "",
      amount: 0,
      type: "Expense" as TransactionType,
      account_type: "Cash" as AccountType,
      category_id: "",
      frequency: "Monthly" as FrequencyType,
      start_date: new Date(),
      // Do not spread initialData here as it may contain fields not in RecurringTransactionFormValues
    },
  })
  
  // Reset form with initialData when it changes or when dialog opens
  useEffect(() => {
    if (isOpen && initialData) {
      console.log('Resetting form with initialData:', initialData)
      
      // Map initialData to the form values format
      const formValues: RecurringTransactionFormValues = {
        name: initialData.name || "",
        description: initialData.description || "",
        amount: initialData.amount || 0,
        type: (initialData.type as TransactionType) || "Expense" as TransactionType,
        account_type: (initialData.account_type as AccountType) || "Cash" as AccountType,
        category_id: initialData.category_id?.toString() || "",
        frequency: (initialData.frequency as FrequencyType) || "Monthly" as FrequencyType,
        start_date: initialData.start_date ? new Date(initialData.start_date) : new Date(),
        end_date: initialData.end_date ? new Date(initialData.end_date as string) : undefined
      }
      
      // Reset the form with the properly mapped values
      form.reset(formValues)
    }
  }, [form, initialData, isOpen])

  const handleSubmit = async (data: RecurringTransactionFormValues) => {
    console.log('RecurringTransactionDialog handleSubmit received data:', data);
    
    if (!user?.id) {
      toast.error("Authentication required", {
        description: "Please sign in to create recurring transactions.",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Format dates to ISO string format
      const formatDate = (date: Date | undefined): string | undefined => {
        return date ? date.toISOString() : undefined;
      };

      // Prepare the form data with proper types
      const submissionData = {
        ...data,
        // Add the user_id from the authenticated user
        user_id: user.id,
        // Ensure category_id is properly parsed as a number
        category_id: data.category_id ? parseInt(data.category_id) : 1,
        // Convert Date objects to ISO strings
        start_date: formatDate(data.start_date) as string,
        end_date: formatDate(data.end_date),
        created_at: mode === 'create' ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      }
      
      console.log(`Processing ${mode} recurring transaction:`, submissionData);

      // Pass the data to the transaction service based on mode
      if (mode === 'create') {
        await transactionService.createRecurringTransaction(submissionData)
        
        toast.success(`Created recurring transaction`, {
          description: "Your recurring transaction has been successfully saved.",
        })
        
        // Reset form and close dialog after successful creation
        form.reset()
        onClose()
      } else if (mode === 'edit' && initialData && initialData.id) {
        // For edit mode, use the transactionService directly if onSubmit is not provided
        if (onSubmit) {
          // Pass the data to the parent component
          await onSubmit(data)
        } else {
          // Use transaction service directly if no onSubmit handler is provided
          // This is the critical fix - directly call the service if no custom handler
          const updateData: UpdateRecurringTransaction = {
            name: data.name,
            amount: data.amount,
            type: data.type,
            account_type: data.account_type,
            category_id: data.category_id ? parseInt(data.category_id) : 1,
            description: data.description,
            frequency: data.frequency,
            start_date: formatDate(data.start_date) as string,
            end_date: formatDate(data.end_date) || null,
            updated_at: new Date().toISOString(),
          };
          
          await transactionService.updateRecurringTransaction(
            initialData.id, 
            updateData, 
            user.id
          );
        }
        
        toast.success(`Updated recurring transaction`, {
          description: "Your recurring transaction has been successfully updated.",
        })
        
        // Close dialog after successful update
        onClose()
      }
    } catch (error) {
      console.error('Failed to submit recurring transaction:', error)
      toast.error("Failed to save recurring transaction", {
        description: error instanceof Error ? error.message : "Please try again.",
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
            {mode === 'create' ? 'Create Recurring Transaction' : 'Edit Recurring Transaction'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Add a new recurring transaction to your records.'
              : 'Make changes to your recurring transaction here.'}
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
                      <Input placeholder="e.g., Rent, Netflix, Salary" {...field} />
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
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Start Date, Type, and Account Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                          onSelect={field.onChange}
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
                          <SelectValue placeholder="Select a type" />
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
                    <FormLabel>Account</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an account" />
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
            </div>

            {/* Category and Frequency */}
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
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id.toString()} value={category.id.toString()}>
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
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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

            {/* End Date */}
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date (Optional)</FormLabel>
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
                            <span className="text-muted-foreground">Pick an end date</span>
                          )}
                          <CalendarIcon className="h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < form.getValues('start_date')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  mode === 'create' ? 'Create Recurring Transaction' : 'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

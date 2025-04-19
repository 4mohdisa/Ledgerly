"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { cn } from "@/lib/utils"

const formSchema = z.object({
  balance: z.string()
    .min(1, "Balance is required")
    .refine(
      (value) => !isNaN(Number(value)) && Number(value) >= 0,
      "Balance must be a positive number"
    )
})

type FormValues = z.infer<typeof formSchema>

interface BalanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BalanceDialog({ open, onOpenChange }: BalanceDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      balance: ""
    }
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    try {
      // Here you would typically update the balance in your state or database

      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to add balance:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Balance</DialogTitle>
          <DialogDescription>
            Enter your current account balance.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Balance Amount</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "relative",
                  isSubmitting && "text-transparent hover:text-transparent"
                )}
              >
                {isSubmitting && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                {isSubmitting ? "Adding..." : "Add Balance"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

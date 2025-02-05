import { z } from "zod"
import { transactionTypes } from "@/data/transactiontypes"
import { frequencies } from "@/data/frequencies"
import { accountTypes } from "@/data/account-types"

export const baseSchema = {
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  amount: z
    .number()
    .positive({ message: "Amount must be a positive number." })
    .max(100000000, { message: "Amount exceeds maximum limit of $100,000,000." }),
  type: z.enum(transactionTypes as [string, ...string[]]),
  account_type: z.enum(accountTypes as [string, ...string[]]),
  category_id: z.string(),
  description: z.string().optional(),
  created_at: z.string().datetime({ offset: true }).optional(),
  updated_at: z.string().datetime({ offset: true }).optional(),
}

export const transactionSchema = z.object({
  ...baseSchema,
  date: z.date().refine(
    (date) => date <= new Date(),
    { message: "Transaction date cannot be in the future." }
  ),
  recurring_frequency: z.enum(frequencies as [string, ...string[]]).optional(),
})

export const recurringTransactionSchema = z.object({
  ...baseSchema,
  frequency: z.enum(frequencies as [string, ...string[]]),
  start_date: z.date(),
  end_date: z.date().optional(),
})

export type TransactionFormValues = z.infer<typeof transactionSchema>
export type RecurringTransactionFormValues = z.infer<typeof recurringTransactionSchema>
export type FormValues = TransactionFormValues | RecurringTransactionFormValues

export interface BaseDialogProps {
  isOpen: boolean
  onClose: () => void
  initialData?: Partial<FormValues>
  mode: 'create' | 'edit'
}

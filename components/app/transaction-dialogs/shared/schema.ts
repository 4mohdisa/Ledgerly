import { z } from "zod"
import { transactionTypes, TransactionType } from "@/data/transactiontypes"
import { frequencies, FrequencyType } from "@/data/frequencies"
import { accountTypes, AccountType } from "@/data/account-types"

// Extract just the values from the frequency objects for the enum
const frequencyValues = frequencies.map(f => f.value)
const frequencyEnum = z.enum(['never', ...frequencyValues] as [string, ...string[]])

export const baseSchema = {
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  amount: z
    .number()
    .positive({ message: "Amount must be a positive number." })
    .max(100000000, { message: "Amount exceeds maximum limit of $100,000,000." }),
  type: z.custom<TransactionType>((val) => transactionTypes.some(item => item.value === val)),
  account_type: z.custom<AccountType>((val) => accountTypes.some(item => item.value === val)),
  category_id: z.string(),
  description: z.string().optional(),
  created_at: z.string().datetime({ offset: true }).optional(),
  updated_at: z.string().datetime({ offset: true }).optional(),
}

export const transactionSchema = z.object({
  ...baseSchema,
  date: z.date({
    required_error: "Please select a date",
    invalid_type_error: "Invalid date format",
  }).refine(
    (date) => date <= new Date(),
    { message: "Transaction date cannot be in the future." }
  ),
  recurring_frequency: z.custom<FrequencyType>(),
  // end_date removed as it's not needed for regular transactions
})

export const recurringTransactionSchema = z.object({
  ...baseSchema,
  frequency: z.custom<FrequencyType>((val) => 
    frequencies.some(item => item.value === val) && val !== "Never"
  ),
  start_date: z.date({
    required_error: "Please select a start date",
    invalid_type_error: "Invalid date format",
  }),
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

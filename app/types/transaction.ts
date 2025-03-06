export interface Transaction {
  id: number
  user_id: string
  date: string
  amount: number
  name: string
  type: string
  account_type: string
  category_id: number
  description?: string | null
  file_id?: number | null
  category_name?: string | null
  recurring_frequency?: string | null
  created_at?: string | null
  updated_at?: string | null
  categories?: {
    name: string
  } | null
}

export interface RecurringTransaction {
  id: number
  user_id: string
  name: string
  amount: number
  type: string
  account_type: string
  category_id: number
  frequency: string
  start_date: string
  description?: string | null
  end_date?: string | null
  created_at?: string | null
  updated_at?: string | null
  categories?: {
    name: string
  } | null
}

export type UpdateTransaction = Omit<Transaction, 'id' | 'user_id' | 'created_at'>;
export type UpdateRecurringTransaction = Omit<RecurringTransaction, 'id' | 'user_id' | 'created_at'>;

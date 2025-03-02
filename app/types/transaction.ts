export interface Transaction {
  id: number
  user_id: string | null
  date: string
  file_id?: number | null
  amount: number
  name: string
  description?: string | null
  type?: string | null
  account_type?: string | null
  category_id?: number | null
  category_name?: string | null
  recurring_frequency?: string | null
  created_at?: string | null
  updated_at?: string | null
  categories?: {
    name: string
  } | null
}

export type UpdateTransaction = Omit<Transaction, 'id' | 'user_id' | 'created_at'>;

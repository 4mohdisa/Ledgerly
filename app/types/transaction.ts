export type TransactionType = 'Expense' | 'Income';
export type AccountType = 'Cash' | 'Savings' | 'Checking';
export type FrequencyType = 'Never' | 'Daily' | 'Weekly' | 'Bi-Weekly' | 'Tri-Weekly' | 'Monthly' | 'Bi-Monthly' | 'Quarterly' | 'Semi-Annually' | 'Annually' | 'Working Days Only' | 'First Day of Week' | 'Last Day of Week';

export interface Transaction {
  id?: number;
  user_id: string;
  date: Date | string;
  amount: number;
  name: string;
  description?: string | null;
  type: string;
  account_type: string;
  category_id: number;
  category_name?: string | null;
  recurring_frequency?: string | null;
  file_id?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  start_date?: Date | string;
  end_date?: Date | string | null;
  // For upcoming transactions that are derived from recurring transactions
  recurring_transaction_id?: number;
  isUpcomingEdit?: boolean;
}

export interface RecurringTransaction {
  id?: number;
  user_id: string;
  name: string;
  amount: number;
  type: string;
  account_type: string;
  category_id: number;
  category_name?: string | null;
  frequency: string;
  start_date: Date | string;
  end_date?: Date | string | null;
  description?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export type UpdateTransaction = Partial<Omit<Transaction, 'id' | 'user_id'>>;
export type UpdateRecurringTransaction = Partial<Omit<RecurringTransaction, 'id' | 'user_id'>>;

export interface TransactionFormData {
  name: string;
  amount: number;
  type: string;
  account_type: string;
  category_id: number;
  description?: string | null;
  date: Date;
  schedule_type: string;
  start_date?: Date | null;
  end_date?: Date | null;
}
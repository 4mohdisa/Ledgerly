export type TransactionType = 'Expense' | 'Income';
export type AccountType = 'Cash' | 'Savings' | 'Checking';
export type FrequencyType = 'Never' | 'Daily' | 'Weekly' | 'Bi-Weekly' | 'Tri-Weekly' | 'Monthly' | 'Bi-Monthly' | 'Quarterly' | 'Semi-Annually' | 'Annually' | 'Working Days Only' | 'First Day of Week' | 'Last Day of Week';

export interface Transaction {
  id?: number;
  user_id: string;
  date: Date;
  amount: number;
  name: string;
  description?: string;
  type: TransactionType;
  account_type: AccountType;
  category_id: number;
  recurring_frequency?: FrequencyType;
  created_at?: string;
  updated_at?: string;
}

export interface RecurringTransaction {
  id?: number;
  user_id: string;
  name: string;
  amount: number;
  type: TransactionType;
  account_type: AccountType;
  category_id: number;
  frequency: FrequencyType;
  start_date: Date;
  end_date?: Date;
  description?: string;
  created_at?: string;
  updated_at?: string;
}
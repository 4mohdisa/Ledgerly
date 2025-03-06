import { createClient } from '@/utils/supabase/client'
import { Transaction, RecurringTransaction, UpdateTransaction, UpdateRecurringTransaction } from '@/app/types/transaction'

class TransactionService {
  private supabase = createClient()

  async createTransaction(data: Omit<Transaction, 'id'>, userId: string) {
    const transactionData = {
      ...data,
      user_id: userId,
      type: data.type || 'expense',
      account_type: data.account_type || 'cash',
      category_id: data.category_id || 1, // Default category ID
    }

    const { data: transaction, error } = await this.supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single()

    if (error) throw error
    return transaction
  }

  async createRecurringTransaction(data: Omit<RecurringTransaction, 'id'>, userId: string) {
    const recurringData = {
      ...data,
      user_id: userId,
      type: data.type || 'expense',
      account_type: data.account_type || 'cash',
      category_id: data.category_id || 1, // Default category ID
    }

    const { data: recurringTransaction, error } = await this.supabase
      .from('recurring_transactions')
      .insert(recurringData)
      .select()
      .single()

    if (error) throw error
    return recurringTransaction
  }

  async updateTransaction(id: number, data: UpdateTransaction, userId: string) {
    const { data: transaction, error } = await this.supabase
      .from('transactions')
      .update(data)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return transaction
  }

  async updateRecurringTransaction(id: number, data: UpdateRecurringTransaction, userId: string) {
    const { data: recurringTransaction, error } = await this.supabase
      .from('recurring_transactions')
      .update(data)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return recurringTransaction
  }

  async deleteTransaction(id: number, userId: string) {
    const { error } = await this.supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
  }

  async deleteRecurringTransaction(id: number, userId: string) {
    const { error } = await this.supabase
      .from('recurring_transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
  }

  async getTransactions(userId: string, dateRange?: { from: Date; to: Date }) {
    let query = this.supabase
      .from('transactions')
      .select('*, categories(name)')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (dateRange) {
      query = query
        .gte('date', dateRange.from.toISOString().split('T')[0])
        .lte('date', dateRange.to.toISOString().split('T')[0])
    }

    const { data, error } = await query

    if (error) throw error
    return data
  }

  async getRecurringTransactions(userId: string) {
    const { data, error } = await this.supabase
      .from('recurring_transactions')
      .select('*, categories(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }
}

export const transactionService = new TransactionService()

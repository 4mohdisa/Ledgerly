import { createClient } from '@/utils/supabase/client';
import { Transaction, RecurringTransaction } from '../types/transaction';

export const transactionService = {
  /**
   * Creates a new regular transaction.
   * @param data - The transaction data to be inserted.
   */
  async createTransaction(data: Omit<Transaction, 'id' | 'user_id'>, id?: any) {
    console.log('=== Starting Transaction Creation ===');
    console.log('Input data:', JSON.stringify(data, null, 2));
    console.log('Creating transaction with data:', JSON.stringify(data, null, 2));
    const supabase = createClient();

    console.log('Verifying Supabase session');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error('Session verification failed');
    }
    if (!session) {
      console.error('No active session found');
      throw new Error('No active session found');
    }

    const userId = session.user.id;

    try {
      console.log('Creating transaction:', { ...data, user_id: userId });

      const transactionData = {
        ...data,
        user_id: userId,
        category_id: Number(data.category_id),
        date: new Date(data.date).toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('Sending transaction data to Supabase:', JSON.stringify(transactionData, null, 2));

      // First, verify the category exists
      const { data: categoryCheck, error: categoryError } = await supabase
        .from('categories')
        .select('id, name')
        .eq('id', transactionData.category_id)
        .maybeSingle();

      if (categoryError) {
        console.error('Category verification failed:', { categoryError, categoryId: transactionData.category_id });
        throw new Error('Failed to verify category. Please try again.');
      }

      if (!categoryCheck) {
        console.error('Category not found:', { categoryId: transactionData.category_id });
        throw new Error('Selected category not found. Please choose a different category.');
      }

      console.log('Category verified:', categoryCheck);

      // Now insert the transaction
      const { data: result, error: transactionError } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select()
        .single();

      if (transactionError) {
        console.error('Transaction creation error:', transactionError);
        if (transactionError.code === '23503') {
          throw new Error('Invalid category selected');
        } else if (transactionError.code === '42501') {
          throw new Error('Permission denied. Please check your authentication and try again.');
        }
        throw new Error(transactionError.message);
      }

      return result;
    } catch (error) {
      console.error('Transaction creation failed:', error);
      throw error;
    }
  },

  /**
   * Creates a new recurring transaction.
   * @param data - The recurring transaction data to be inserted.
   */
  async createRecurringTransaction(data: Omit<RecurringTransaction, 'id' | 'user_id'>, id?: any) {
    const supabase = createClient();

    console.log('Verifying Supabase session');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error('Session verification failed');
    }
    if (!session) {
      console.error('No active session found');
      throw new Error('No active session found');
    }

    const userId = session.user.id;

    try {
      console.log('Creating recurring transaction:', { ...data, user_id: userId });

      const { data: result, error } = await supabase
        .from('recurring_transactions')
        .insert([
          {
            ...data,
            user_id: userId,
            category_id: Number(data.category_id),
            start_date: new Date(data.start_date).toISOString().split('T')[0],
            end_date: data.end_date ? new Date(data.end_date).toISOString().split('T')[0] : null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Recurring transaction creation error:', error);
        throw error;
      }

      return result;
    } catch (error) {
      console.error('Recurring transaction creation failed:', error);
      throw error;
    }
  },
};
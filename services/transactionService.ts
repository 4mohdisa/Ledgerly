import { createClient } from '@/utils/supabase/client';
import { Transaction } from '@/app/types/transaction';

// Transaction service for handling API calls
export const transactionService = {
  /**
   * Fetches upcoming transactions for a user
   * @param userId - The ID of the user
   * @returns Promise with upcoming transactions
   */
  getUpcomingTransactions: async (userId: string): Promise<Transaction[]> => {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const supabase = createClient();
    // Use a different query approach to avoid type issues
    const { data, error } = await supabase
      .from('upcoming_transactions')
      .select('*, categories(name)')
      .eq('user_id', userId as any) // Type assertion to fix userId type mismatch
      .order('date', { ascending: true } as any); // Type assertion to fix Supabase typing issue
      
    if (error) {
      throw error;
    }
    
    if (!data) {
      return [];
    }
    
    // Transform the data to match the Transaction interface
    return data.map((item: any): Transaction => ({
      id: typeof item.id === 'number' ? item.id : parseInt(item.id.toString(), 10),
      user_id: item.user_id.toString(),
      name: item.name || '',
      amount: item.amount,
      date: item.date,
      type: item.type || 'Expense',
      account_type: item.account_type || 'Checking', // Add missing required field
      category_id: item.category_id || 0,
      category_name: item.categories?.name || 'Uncategorized',
      recurring_transaction_id: item.recurring_transaction_id,
      description: item.description || null,
      created_at: item.created_at || null,
      updated_at: item.updated_at || null
    }));
  }
};

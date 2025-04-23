import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Transaction, RecurringTransaction } from '@/app/types/transaction';
import { createClient } from '@/utils/supabase/client';

// State interface
interface RecurringTransactionsState {
  items: RecurringTransaction[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  upcomingTransactions: Transaction[];
  upcomingStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  upcomingError: string | null;
  lastFetched: number | null;
}

// Initial state
const initialState: RecurringTransactionsState = {
  items: [],
  status: 'idle',
  error: null,
  upcomingTransactions: [],
  upcomingStatus: 'idle',
  upcomingError: null,
  lastFetched: null
};

/**
 * Fetch recurring transactions
 */
export const fetchRecurringTransactions = createAsyncThunk(
  'recurringTransactions/fetchRecurringTransactions',
  async (userId: string) => {
    const supabase = createClient();
    
    // Cast the userId parameter directly to avoid TypeScript errors
    // This is a workaround for Supabase's inconsistent typing
    const { data, error } = await supabase
      .from('recurring_transactions')
      .select('*, categories(name)')
      .eq('user_id', userId as any)
      .order('created_at', { ascending: false } as any);
      
    if (error) {
      throw new Error(error.message);
    }
    
    return data as RecurringTransaction[];
  }
);

/**
 * Generate upcoming transactions from recurring transactions
 */
export const fetchUpcomingTransactions = createAsyncThunk<Transaction[], string>(
  'recurringTransactions/fetchUpcomingTransactions',
  async (userId: string, { getState }): Promise<Transaction[]> => {
    // Get the current state to access recurring transactions
    const state = getState() as any;
    const recurringTransactions = state.recurringTransactions.items;
    
    // If we don't have recurring transactions yet, fetch them first
    if (!recurringTransactions || recurringTransactions.length === 0) {
      // Fetch recurring transactions first
      const supabase = createClient();
      const { data, error } = await supabase
        .from('recurring_transactions')
        .select('*, categories(name)')
        .eq('user_id', userId as any);
        
      if (error) {
        throw new Error(error.message);
      }
      
      // Use the fetched recurring transactions
      return generateUpcomingTransactionsFromRecurring(data || [], userId);
    }
    
    // Generate upcoming transactions from the recurring transactions in state
    return generateUpcomingTransactionsFromRecurring(recurringTransactions, userId);
  }
);

/**
 * Helper function to generate upcoming transactions from recurring transactions
 * @param recurringTransactions - The recurring transactions to generate from
 * @param userId - The user ID
 * @returns An array of upcoming transactions
 */
function generateUpcomingTransactionsFromRecurring(recurringTransactions: any[], userId: string): Transaction[] {
  const today = new Date();
  const upcomingTransactions: Transaction[] = [];
  
  // Process each recurring transaction
  recurringTransactions.forEach((recurringTx: any) => {
    // Skip if no start date or if end date is in the past
    if (!recurringTx.start_date) return;
    
    const startDate = new Date(recurringTx.start_date);
    if (recurringTx.end_date && new Date(recurringTx.end_date) < today) return;
    
    // Calculate next occurrence dates based on frequency
    const nextDates = getNextOccurrences(startDate, recurringTx.frequency, 2);
    
    // Create transaction objects for each upcoming date
    nextDates.forEach((date, index) => {
      upcomingTransactions.push({
        id: recurringTx.id * 1000 + index, // Generate a unique ID
        user_id: userId,
        name: recurringTx.name,
        amount: recurringTx.amount,
        date: date.toISOString(),
        type: recurringTx.type || 'Expense',
        account_type: recurringTx.account_type || 'Checking',
        category_id: recurringTx.category_id || 0,
        category_name: recurringTx.categories?.name || 'Uncategorized',
        recurring_transaction_id: recurringTx.id,
        description: recurringTx.description || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    });
  });
  
  // Sort by date
  return upcomingTransactions.sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
}

/**
 * Calculate the next N occurrences based on frequency
 * @param startDate - The start date
 * @param frequency - The frequency (weekly, monthly, etc.)
 * @param count - How many occurrences to generate
 * @returns Array of dates
 */
function getNextOccurrences(startDate: Date, frequency: string, count: number): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  let currentDate = new Date(Math.max(startDate.getTime(), today.getTime()));
  
  for (let i = 0; i < count; i++) {
    // Clone the date to avoid modifying the original
    const nextDate = new Date(currentDate);
    
    // Add to the date based on frequency
    switch (frequency.toLowerCase()) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + (i + 1));
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + ((i + 1) * 7));
        break;
      case 'bi-weekly':
        nextDate.setDate(nextDate.getDate() + ((i + 1) * 14));
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + (i + 1));
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + ((i + 1) * 3));
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + (i + 1));
        break;
      default:
        nextDate.setMonth(nextDate.getMonth() + (i + 1)); // Default to monthly
    }
    
    dates.push(nextDate);
  }
  
  return dates;
}

/**
 * Create recurring transaction
 */
export const createRecurringTransaction = createAsyncThunk(
  'recurringTransactions/createRecurringTransaction',
  async (transaction: Partial<RecurringTransaction>) => {
    const supabase = createClient();
    // Convert any Date objects to ISO strings before inserting
    const formattedTransaction = {
      ...transaction,
      start_date: transaction.start_date instanceof Date 
        ? transaction.start_date.toISOString() 
        : transaction.start_date,
      end_date: transaction.end_date instanceof Date 
        ? transaction.end_date.toISOString() 
        : transaction.end_date
    };
    
    const { data, error } = await supabase
      .from('recurring_transactions')
      .insert(formattedTransaction as any) // Type assertion for Supabase typing issue
      .select('*')
      .single();
      
    if (error) {
      throw new Error(error.message);
    }
    
    return data as RecurringTransaction;
  }
);

/**
 * Update recurring transaction
 */
export const updateRecurringTransaction = createAsyncThunk<RecurringTransaction, { id: number | string; data: Partial<RecurringTransaction>; userId: string }>(
  'recurringTransactions/updateRecurringTransaction',
  async ({ id, data, userId }, { rejectWithValue }) => {
    try {
      const supabase = createClient();
      // Convert any Date objects to ISO strings before updating
      const formattedData = {
        ...data,
        start_date: data.start_date instanceof Date 
          ? data.start_date.toISOString() 
          : data.start_date,
        end_date: data.end_date instanceof Date 
          ? data.end_date.toISOString() 
          : data.end_date
      };
      
      // Ensure id is a number for the database query
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      
      console.log('Updating recurring transaction in Supabase:', { id: numericId, formattedData, userId });
      
      // Use select() to get the updated record back
      const { data: updatedTransaction, error } = await supabase
        .from('recurring_transactions')
        .update(formattedData as any) // Type assertion for Supabase typing issue
        .eq('id', numericId)
        .eq('user_id', userId)
        .select('*, categories(name)')
        .single();
        
      if (error) {
        console.error('Error updating recurring transaction:', error);
        return rejectWithValue(error.message);
      }
      
      if (!updatedTransaction) {
        console.error('No transaction returned from update operation');
        return rejectWithValue('No transaction returned from update operation');
      }
      
      console.log('Updated transaction from Supabase:', updatedTransaction);
      
      // Return the complete updated transaction from Supabase
      return updatedTransaction as RecurringTransaction;
    } catch (error) {
      console.error('Unexpected error in updateRecurringTransaction:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  }
);

/**
 * Delete recurring transaction
 */
export const deleteRecurringTransaction = createAsyncThunk(
  'recurringTransactions/deleteRecurringTransaction',
  async ({ id, userId }: { id: number; userId: string }) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('recurring_transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
      
    if (error) {
      throw new Error(error.message);
    }
    
    return id;
  }
);

/**
 * Recurring transactions slice
 */
const recurringTransactionsSlice = createSlice({
  name: 'recurringTransactions',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch recurring transactions
      .addCase(fetchRecurringTransactions.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchRecurringTransactions.fulfilled, (state, action: PayloadAction<RecurringTransaction[]>) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchRecurringTransactions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch recurring transactions';
      })
      
      // Fetch upcoming transactions
      .addCase(fetchUpcomingTransactions.pending, (state) => {
        state.upcomingStatus = 'loading';
      })
      .addCase(fetchUpcomingTransactions.fulfilled, (state, action: PayloadAction<Transaction[]>) => {
        state.upcomingStatus = 'succeeded';
        state.upcomingTransactions = action.payload;
        state.lastFetched = Date.now();
      })
      .addCase(fetchUpcomingTransactions.rejected, (state, action) => {
        state.upcomingStatus = 'failed';
        state.upcomingError = action.error.message || 'Failed to fetch upcoming transactions';
      })
      
      // Create recurring transaction
      .addCase(createRecurringTransaction.fulfilled, (state, action: PayloadAction<RecurringTransaction>) => {
        state.items.push(action.payload);
      })
      
      // Update recurring transaction
      .addCase(updateRecurringTransaction.fulfilled, (state, action) => {
        const updatedTransaction = action.payload;
        
        if (!updatedTransaction || !updatedTransaction.id) {
          console.error('Invalid transaction data in updateRecurringTransaction.fulfilled');
          return;
        }
        
        // Extract category name from the nested categories object if it exists
        let categoryName = null;
        // Supabase returns joined tables as nested objects, but our TypeScript interface doesn't reflect this
        // Use type assertion to access the categories property
        const transactionWithCategories = updatedTransaction as any;
        if (transactionWithCategories.categories && transactionWithCategories.categories.name) {
          categoryName = transactionWithCategories.categories.name;
          // Remove the categories object to avoid nesting issues
          delete transactionWithCategories.categories;
        }
        
        // Ensure the category_name is set correctly
        const processedTransaction = {
          ...updatedTransaction,
          category_name: categoryName || updatedTransaction.category_name
        };
        
        // Use functional approach to update the state
        state.items = state.items.map(item => 
          item.id === processedTransaction.id ? processedTransaction : item
        );
      })
      
      // Delete recurring transaction
      .addCase(deleteRecurringTransaction.fulfilled, (state, action: PayloadAction<number>) => {
        state.items = state.items.filter(item => item.id !== action.payload);
      });
  }
});

export default recurringTransactionsSlice.reducer;

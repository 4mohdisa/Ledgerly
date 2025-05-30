import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Transaction, RecurringTransaction } from '@/app/types/transaction';
import { createClient } from '@/utils/supabase/client';

/**
 * Simple string hash function to convert a string to a number
 * This is used to generate numeric IDs from string values
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

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
export const fetchRecurringTransactions = createAsyncThunk<RecurringTransaction[], string>(
  'recurringTransactions/fetchRecurringTransactions',
  async (userId: string, { rejectWithValue }) => {
    try {
      const supabase = createClient();
      
      console.log('Fetching recurring transactions for user:', userId);
      
      const { data, error } = await supabase
        .from('recurring_transactions')
        .select('*, categories(name)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching recurring transactions:', error);
        return rejectWithValue(error.message);
      }
      
      // Process the data to ensure it's properly formatted
      const processedData = (data || []).map(item => {
        // Extract category name from nested object if present
        let categoryName = null;
        if (item.categories && 'name' in item.categories) {
          categoryName = item.categories.name;
        }
        
        return {
          ...item,
          // Ensure category_id is a number
          category_id: typeof item.category_id === 'string' 
            ? parseInt(item.category_id, 10) 
            : item.category_id,
          // Set category_name from extracted value
          category_name: categoryName,
          // Remove categories object to avoid nesting issues
          categories: undefined
        };
      });
      
      console.log('Fetched recurring transactions:', processedData.length);
      return processedData as RecurringTransaction[];
    } catch (error) {
      console.error('Unexpected error in fetchRecurringTransactions:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  }
);

/**
 * Generate upcoming transactions from recurring transactions
 */
export const fetchUpcomingTransactions = createAsyncThunk<Transaction[], string>(
  'recurringTransactions/fetchUpcomingTransactions',
  async (userId: string, { getState }): Promise<Transaction[]> => {
    try {
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
          .eq('user_id', userId);
          
        if (error) {
          console.error('Error fetching recurring transactions:', error);
          throw new Error(error.message);
        }
        
        // Process the data to ensure it's properly formatted
        const processedData = (data || []).map(item => ({
          ...item,
          // Ensure category_id is a number
          category_id: typeof item.category_id === 'string' 
            ? parseInt(item.category_id, 10) 
            : item.category_id,
          // Extract category name from nested object if present
          category_name: item.categories?.name || null
        }));
        
        // Use the fetched recurring transactions
        return generateUpcomingTransactionsFromRecurring(processedData, userId);
      }
      
      // Generate upcoming transactions from the recurring transactions in state
      return generateUpcomingTransactionsFromRecurring(recurringTransactions, userId);
    } catch (error) {
      console.error('Error in fetchUpcomingTransactions:', error);
      throw error;
    }
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
      // Generate a unique ID that works for both numeric and string IDs
      // For numeric IDs, multiply by 1000 and add index
      // For string IDs, use a hash function to generate a numeric ID
      const uniqueId = typeof recurringTx.id === 'number' 
        ? recurringTx.id * 1000 + index
        : Math.abs(hashCode(recurringTx.id + '-' + index.toString()));
      
      upcomingTransactions.push({
        id: uniqueId,
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
      console.log('updateRecurringTransaction action called with:', { id, data, userId });
      
      const supabase = createClient();
      
      // Convert any Date objects to ISO strings before updating
      // Also ensure we're not updating user_id as it's a UUID and used as a filter
      const { user_id, id: dataId, ...dataWithoutIds } = data as any;
      
      // Format the data for Supabase
      const formattedData = {
        ...dataWithoutIds,
        start_date: data.start_date instanceof Date 
          ? data.start_date.toISOString() 
          : data.start_date,
        end_date: data.end_date instanceof Date 
          ? data.end_date.toISOString() 
          : data.end_date
      };
      
      // Ensure id is a number for the database query
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      
      console.log('Updating recurring transaction in Supabase:', { 
        id: numericId, 
        formattedData, 
        userId,
        url: '/rest/v1/recurring_transactions' // Can't access supabaseUrl directly
      });
      
      // Use select() to get the updated record back
      const { data: updatedTransaction, error } = await supabase
        .from('recurring_transactions')
        .update(formattedData)
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

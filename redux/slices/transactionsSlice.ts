import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Transaction } from '@/app/types/transaction';
import { createClient } from '@/utils/supabase/client';

// Define the state interface
interface TransactionsState {
  items: Transaction[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  lastFetched: number | null;
}

// Initial state
const initialState: TransactionsState = {
  items: [],
  status: 'idle',
  error: null,
  lastFetched: null
};

/**
 * Fetch transactions
 */
export const fetchTransactions = createAsyncThunk(
  'transactions/fetchTransactions',
  async (userId: string) => {
    const supabase = createClient();
    
    // Fetch all transactions and filter client-side to avoid type issues
    const { data, error } = await supabase
      .from('transactions')
      .select('*, categories(name)');
      
    if (error) {
      // Handle error with proper type checking
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error
        ? String(error.message)
        : 'Unknown error fetching transactions';
      throw new Error(errorMessage);
    }
    
    // Handle potential null data
    if (!data) {
      return [];
    }
    
    // Filter by user_id on the client side
    const filteredData = (data as any[]).filter(item => {
      const itemUserId = item.user_id?.toString();
      return itemUserId === userId;
    });
    
    // Transform the data to match the Transaction interface
    return filteredData.map(item => ({
      id: typeof item.id === 'number' ? item.id : parseInt(item.id.toString(), 10),
      user_id: item.user_id?.toString(),
      name: item.name || '',
      amount: item.amount,
      date: item.date,
      type: item.type || 'Expense',
      account_type: item.account_type || 'Checking',
      category_id: item.category_id || 0,
      category_name: item.categories?.name || 'Uncategorized',
      description: item.description || null,
      created_at: item.created_at || null,
      updated_at: item.updated_at || null
    }));
  }
);

/**
 * Create transaction
 */
export const createTransaction = createAsyncThunk(
  'transactions/createTransaction',
  async (transaction: Partial<Transaction>) => {
    const supabase = createClient();
    
    // Ensure user_id is properly formatted for the database
    // If it's a string (UUID), try to convert it to a number if possible
    const preparedTransaction = { ...transaction };
    // Handle user_id type conversion
    // We'll leave it as a string since that's what our Transaction interface expects
    if (typeof preparedTransaction.user_id !== 'string' && preparedTransaction.user_id !== null) {
      preparedTransaction.user_id = String(preparedTransaction.user_id);
    }
    
    // Format date if it's a Date object
    const formattedTransaction = {
      ...preparedTransaction,
      date: preparedTransaction.date instanceof Date 
        ? preparedTransaction.date.toISOString().split('T')[0] 
        : preparedTransaction.date
    };
    
    const { data, error } = await supabase
      .from('transactions')
      .insert(formattedTransaction as any)
      .select('*')
      .single();
      
    if (error) {
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error
        ? String(error.message)
        : 'Unknown error creating transaction';
      throw new Error(errorMessage);
    }
    
    if (!data) {
      throw new Error('No data returned from transaction creation');
    }
    
    // Convert the data to match our Transaction interface
    // Handle the case where categories might not be available in the response
    // Use a type assertion to avoid TypeScript errors
    const dataAny = data as any;
    const categoryName = dataAny.categories?.name || 
                        (data.category_id ? 'Category ' + data.category_id : 'Uncategorized');
    
    return {
      id: data.id,
      user_id: data.user_id?.toString(),
      name: data.name || '',
      amount: data.amount,
      date: data.date,
      type: data.type || 'Expense',
      account_type: data.account_type || 'Checking',
      category_id: data.category_id || 0,
      category_name: categoryName,
      description: data.description || null,
      created_at: data.created_at || null,
      updated_at: data.updated_at || null
    } as Transaction;
  }
);

/**
 * Update transaction
 */
export const updateTransaction = createAsyncThunk(
  'transactions/updateTransaction',
  async ({ id, data, userId }: { id: number; data: Partial<Transaction>; userId: string }) => {
    const supabase = createClient();
    
    // First, verify the transaction exists and belongs to the user
    const { data: transactionData, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      const errorMessage = typeof fetchError === 'object' && fetchError !== null && 'message' in fetchError
        ? String(fetchError.message)
        : 'Unknown error fetching transaction';
      throw new Error(errorMessage);
    }
    
    // Verify ownership by comparing string representations
    const transactionUserId = transactionData?.user_id?.toString();
    if (transactionUserId !== userId) {
      throw new Error('Transaction not found or not owned by user');
    }
    
    // Format date if it's a Date object
    const formattedData = {
      ...data,
      date: data.date instanceof Date 
        ? data.date.toISOString().split('T')[0] 
        : data.date
    };
    
    // Now perform the update without the user_id filter
    const { error } = await supabase
      .from('transactions')
      .update(formattedData as any)
      .eq('id', id);
      
    if (error) {
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error
        ? String(error.message)
        : 'Unknown error updating transaction';
      throw new Error(errorMessage);
    }
    
    return { id, ...data };
  }
);

/**
 * Delete transaction
 */
export const deleteTransaction = createAsyncThunk(
  'transactions/deleteTransaction',
  async ({ id, userId }: { id: number; userId: string }) => {
    const supabase = createClient();
    
    // First, verify the transaction exists and belongs to the user
    const { data: transactionData, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      const errorMessage = typeof fetchError === 'object' && fetchError !== null && 'message' in fetchError
        ? String(fetchError.message)
        : 'Unknown error fetching transaction';
      throw new Error(errorMessage);
    }
    
    // Verify ownership by comparing string representations
    const transactionUserId = transactionData?.user_id?.toString();
    if (transactionUserId !== userId) {
      throw new Error('Transaction not found or not owned by user');
    }
    
    // Now perform the delete without the user_id filter
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
      
    if (error) {
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error
        ? String(error.message)
        : 'Unknown error deleting transaction';
      throw new Error(errorMessage);
    }
    
    return id;
  }
);

/**
 * Transactions slice
 */
const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch transactions
      .addCase(fetchTransactions.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTransactions.fulfilled, (state, action: PayloadAction<Transaction[]>) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.lastFetched = Date.now();
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch transactions';
      })
      
      // Create transaction
      .addCase(createTransaction.fulfilled, (state, action: PayloadAction<Transaction>) => {
        state.items.push(action.payload);
      })
      
      // Update transaction
      .addCase(updateTransaction.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload };
        }
      })
      
      // Delete transaction
      .addCase(deleteTransaction.fulfilled, (state, action: PayloadAction<number>) => {
        state.items = state.items.filter(item => item.id !== action.payload);
      });
  }
});

export default transactionsSlice.reducer;

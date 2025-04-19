import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Transaction, UpdateTransaction } from '@/app/types/transaction';
import { transactionService } from '@/app/services/transaction-services';
import { setLoading } from './uiSlice';
import type { AppDispatch } from '../store';
import { createClient } from '@/utils/supabase/client';
import { format } from 'date-fns';

interface TransactionsState {
  items: Transaction[];
  error: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  selectedTransaction: Transaction | null;
}

const initialState: TransactionsState = {
  items: [],
  error: null,
  status: 'idle',
  selectedTransaction: null,
};

// Async thunks for transactions
export const fetchTransactions = createAsyncThunk(
  'transactions/fetchTransactions',
  async ({ userId, dateRange }: { userId: string; dateRange?: { from: Date; to: Date } }, { dispatch }) => {
    dispatch(setLoading({ key: 'transactions', value: true }));
    try {
      const supabase = createClient();
      let query = supabase
        .from('transactions')
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (dateRange?.from) {
        query = query.gte('date', format(dateRange.from, 'yyyy-MM-dd'));
      }
      if (dateRange?.to) {
        query = query.lte('date', format(dateRange.to, 'yyyy-MM-dd'));
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return data as Transaction[];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    } finally {
      dispatch(setLoading({ key: 'transactions', value: false }));
    }
  }
);

export const createTransaction = createAsyncThunk<Transaction, any, { dispatch: AppDispatch }>
  ('transactions/createTransaction',
  async (transactionData: any, { dispatch }) => {
    dispatch(setLoading({ key: 'transactions', value: true }));
    try {
      const result = await transactionService.createTransaction(transactionData);
      
      // Handle potential complex return types by ensuring we have a valid Transaction object
      if (result && typeof result === 'object') {
        // If result has a transaction property (might be a complex object), extract it
        if ('transaction' in result) {
          const transaction = result.transaction as any;
          // Ensure we have a valid Transaction object with required fields
          return {
            id: transaction.id,
            user_id: transaction.user_id || transactionData.user_id,
            date: transaction.date,
            amount: transaction.amount,
            name: transaction.name,
            type: transaction.type,
            account_type: transaction.account_type,
            category_id: transaction.category_id,
            description: transaction.description,
            category_name: transaction.category_name,
          } as Transaction;
        }
        
        // If it's already a Transaction object, return it
        return result as Transaction;
      }
      
      throw new Error('Invalid transaction data returned');
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    } finally {
      dispatch(setLoading({ key: 'transactions', value: false }));
    }
  }
);

export const updateTransaction = createAsyncThunk<Transaction, { id: number; data: UpdateTransaction }, { dispatch: AppDispatch }>
  ('transactions/updateTransaction',
  async ({ id, data }: { id: number; data: UpdateTransaction }, { dispatch }) => {
    dispatch(setLoading({ key: 'transactions', value: true }));
    try {
      const result = await transactionService.updateTransaction(id, data);
      
      // Handle potential complex return types by ensuring we have a valid Transaction object
      if (result && typeof result === 'object') {
        // If it's already a Transaction object, return it
        return result as Transaction;
      }
      
      throw new Error('Invalid transaction data returned');
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    } finally {
      dispatch(setLoading({ key: 'transactions', value: false }));
    }
  }
);

export const deleteTransaction = createAsyncThunk<number, { id: number, userId: string }, { dispatch: AppDispatch }>
  ('transactions/deleteTransaction',
  async ({ id, userId }, { dispatch }) => {
    dispatch(setLoading({ key: 'transactions', value: true }));
    try {
      await transactionService.deleteTransaction(id, userId);
      return id;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    } finally {
      dispatch(setLoading({ key: 'transactions', value: false }));
    }
  }
);

export const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    setSelectedTransaction: (state, action: PayloadAction<Transaction | null>) => {
      state.selectedTransaction = action.payload;
    },
    clearTransactions: (state) => {
      state.items = [];
      state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch transactions
      .addCase(fetchTransactions.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch transactions';
      })
      // Create transaction
      .addCase(createTransaction.fulfilled, (state, action) => {
        if (action.payload) {
          state.items.unshift(action.payload);
        }
      })
      // Update transaction
      .addCase(updateTransaction.fulfilled, (state, action) => {
        if (action.payload && action.payload.id) {
          const index = state.items.findIndex(item => item.id === action.payload.id);
          if (index !== -1) {
            state.items[index] = action.payload;
          }
        }
      })
      // Delete transaction
      .addCase(deleteTransaction.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload);
      });
  },
});

export const { setSelectedTransaction, clearTransactions } = transactionsSlice.actions;

export default transactionsSlice.reducer;

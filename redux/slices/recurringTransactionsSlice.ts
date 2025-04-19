import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RecurringTransaction, UpdateRecurringTransaction, Transaction } from '@/app/types/transaction';
import { transactionService } from '@/app/services/transaction-services';
import { setLoading } from './uiSlice';
import type { AppDispatch } from '../store';
import { calculateUpcomingTransactions } from '@/utils/calculate-upcoming-transactions';

interface RecurringTransactionsState {
  items: RecurringTransaction[];
  upcomingTransactions: any[];
  error: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  upcomingStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  selectedRecurringTransaction: RecurringTransaction | null;
}

const initialState: RecurringTransactionsState = {
  items: [],
  upcomingTransactions: [],
  error: null,
  status: 'idle',
  upcomingStatus: 'idle',
  selectedRecurringTransaction: null,
};

// Async thunks for recurring transactions
export const fetchRecurringTransactions = createAsyncThunk(
  'recurringTransactions/fetchRecurringTransactions',
  async (userId: string, { dispatch }) => {
    dispatch(setLoading({ key: 'recurringTransactions', value: true }));
    try {
      const transactions = await transactionService.getRecurringTransactions(userId);
      
      // Ensure all required fields are present and handle null values
      const validTransactions = (transactions || []).map(t => {
        // Make sure user_id is a string and not null
        const user_id = t.user_id || userId;
        
        // Create a properly typed RecurringTransaction object
        const transaction: RecurringTransaction = {
          id: t.id,
          user_id: user_id.toString(), // Ensure user_id is always a string
          name: t.name,
          amount: t.amount,
          type: t.type,
          account_type: t.account_type,
          category_id: t.category_id || 0, // Default to 0 if null
          category_name: t.category_name,
          frequency: t.frequency,
          start_date: t.start_date,
          end_date: t.end_date,
          description: t.description,
          created_at: t.created_at,
          updated_at: t.updated_at
        };
        
        return transaction;
      });
      
      return validTransactions;
    } catch (error) {
      console.error('Error fetching recurring transactions:', error);
      throw error;
    } finally {
      dispatch(setLoading({ key: 'recurringTransactions', value: false }));
    }
  }
);

export const fetchUpcomingTransactions = createAsyncThunk<Transaction[], string, { dispatch: AppDispatch, state: any }>
  ('recurringTransactions/fetchUpcomingTransactions',
  async (userId: string, { dispatch, getState }) => {
    dispatch(setLoading({ key: 'upcomingTransactions', value: true }));
    try {
      // Get recurring transactions from state or fetch them if not available
      const state = getState() as any;
      let recurringTransactions = state.recurringTransactions.items;
      
      if (recurringTransactions.length === 0) {
        // Fetch recurring transactions first
        const fetchedTransactions = await transactionService.getRecurringTransactions(userId);
        
        // Convert to properly typed RecurringTransaction objects
        recurringTransactions = fetchedTransactions.map(t => ({
          id: t.id,
          user_id: (t.user_id || userId).toString(),
          name: t.name,
          amount: t.amount,
          type: t.type,
          account_type: t.account_type,
          category_id: t.category_id || 0,
          category_name: t.category_name,
          frequency: t.frequency,
          start_date: t.start_date,
          end_date: t.end_date,
          description: t.description,
          created_at: t.created_at,
          updated_at: t.updated_at
        }));
      }
      
      // Calculate upcoming transactions (2 per recurring transaction)
      const upcomingTransactions = calculateUpcomingTransactions(recurringTransactions, 2);
      return upcomingTransactions;
    } catch (error) {
      console.error('Error calculating upcoming transactions:', error);
      throw error;
    } finally {
      dispatch(setLoading({ key: 'upcomingTransactions', value: false }));
    }
  }
);

export const createRecurringTransaction = createAsyncThunk(
  'recurringTransactions/createRecurringTransaction',
  async (transactionData: any, { dispatch }) => {
    dispatch(setLoading({ key: 'recurringTransactions', value: true }));
    try {
      const result = await transactionService.createRecurringTransaction(transactionData);
      // Ensure the result is properly typed
      return result as RecurringTransaction;
    } catch (error) {
      console.error('Error creating recurring transaction:', error);
      throw error;
    } finally {
      dispatch(setLoading({ key: 'recurringTransactions', value: false }));
    }
  }
);

export const updateRecurringTransaction = createAsyncThunk(
  'recurringTransactions/updateRecurringTransaction',
  async ({ id, data, userId }: { id: number; data: UpdateRecurringTransaction; userId: string }, { dispatch }) => {
    dispatch(setLoading({ key: 'recurringTransactions', value: true }));
    try {
      const result = await transactionService.updateRecurringTransactionWithUpcoming(id, data, userId);
      return result;
    } catch (error) {
      console.error('Error updating recurring transaction:', error);
      throw error;
    } finally {
      dispatch(setLoading({ key: 'recurringTransactions', value: false }));
    }
  }
);

export const deleteRecurringTransaction = createAsyncThunk<number, { id: number, userId: string | number }, { dispatch: AppDispatch }>
  ('recurringTransactions/deleteRecurringTransaction',
  async ({ id, userId }, { dispatch }) => {
    dispatch(setLoading({ key: 'recurringTransactions', value: true }));
    try {
      await transactionService.deleteRecurringTransaction(id, userId);
      return id;
    } catch (error) {
      console.error('Error deleting recurring transaction:', error);
      throw error;
    } finally {
      dispatch(setLoading({ key: 'recurringTransactions', value: false }));
    }
  }
);

export const recurringTransactionsSlice = createSlice({
  name: 'recurringTransactions',
  initialState,
  reducers: {
    setSelectedRecurringTransaction: (state, action: PayloadAction<RecurringTransaction | null>) => {
      state.selectedRecurringTransaction = action.payload;
    },
    clearRecurringTransactions: (state) => {
      state.items = [];
      state.status = 'idle';
    },
    clearUpcomingTransactions: (state) => {
      state.upcomingTransactions = [];
      state.upcomingStatus = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch recurring transactions
      .addCase(fetchRecurringTransactions.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchRecurringTransactions.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchRecurringTransactions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch recurring transactions';
      })
      // Fetch upcoming transactions
      .addCase(fetchUpcomingTransactions.pending, (state) => {
        state.upcomingStatus = 'loading';
      })
      .addCase(fetchUpcomingTransactions.fulfilled, (state, action) => {
        state.upcomingStatus = 'succeeded';
        state.upcomingTransactions = action.payload;
        state.error = null;
      })
      .addCase(fetchUpcomingTransactions.rejected, (state, action) => {
        state.upcomingStatus = 'failed';
        state.error = action.error.message || 'Failed to fetch upcoming transactions';
      })
      // Create recurring transaction
      .addCase(createRecurringTransaction.fulfilled, (state, action) => {
        if (action.payload) {
          // Ensure the payload has the required fields
          const transaction = {
            ...action.payload,
            // Make sure user_id is always a string
            user_id: action.payload.user_id || '',
          } as RecurringTransaction;
          
          state.items.push(transaction);
        }
      })
      // Update recurring transaction
      .addCase(updateRecurringTransaction.fulfilled, (state, action) => {
        if (action.payload && action.payload.id) {
          // Ensure the payload has the required fields
          const transaction = {
            ...action.payload,
            // Make sure user_id is always a string
            user_id: action.payload.user_id || '',
          } as RecurringTransaction;
          
          const index = state.items.findIndex(item => item.id === transaction.id);
          if (index !== -1) {
            state.items[index] = transaction;
          }
        }
      })
      // Delete recurring transaction
      .addCase(deleteRecurringTransaction.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload);
      });
  },
});

export const { 
  setSelectedRecurringTransaction, 
  clearRecurringTransactions,
  clearUpcomingTransactions
} = recurringTransactionsSlice.actions;

export default recurringTransactionsSlice.reducer;

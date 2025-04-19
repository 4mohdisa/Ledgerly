import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  date: string;
  type: 'Income' | 'Expense';
  category_id?: string;
  category_name?: string;
  account_id?: string;
  account_name?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TransactionsState {
  items: Transaction[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: TransactionsState = {
  items: [],
  status: 'idle',
  error: null
};

// Async thunks for API calls
export const fetchTransactions = createAsyncThunk(
  'transactions/fetchTransactions',
  async (userId: string, { rejectWithValue }) => {
    try {
      // This would normally be an API call
      // For now, return an empty array to allow the app to render
      return [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const addTransaction = createAsyncThunk(
  'transactions/addTransaction',
  async (transaction: Omit<Transaction, 'id'>, { rejectWithValue }) => {
    try {
      // This would normally be an API call
      // For now, create a dummy transaction with a fake ID
      const newTransaction = {
        ...transaction,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return newTransaction;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateTransaction = createAsyncThunk(
  'transactions/updateTransaction',
  async (transaction: Transaction, { rejectWithValue }) => {
    try {
      // This would normally be an API call
      return transaction;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteTransaction = createAsyncThunk(
  'transactions/deleteTransaction',
  async (transactionId: string, { rejectWithValue }) => {
    try {
      // This would normally be an API call
      return transactionId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    // Reducers for local state updates
    setTransactionStatus(state, action: PayloadAction<'idle' | 'loading' | 'succeeded' | 'failed'>) {
      state.status = action.payload;
    },
    clearTransactionError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchTransactions
      .addCase(fetchTransactions.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      
      // addTransaction
      .addCase(addTransaction.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(addTransaction.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items.push(action.payload);
      })
      .addCase(addTransaction.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      
      // updateTransaction
      .addCase(updateTransaction.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateTransaction.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateTransaction.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      
      // deleteTransaction
      .addCase(deleteTransaction.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteTransaction.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = state.items.filter(item => item.id !== action.payload);
      })
      .addCase(deleteTransaction.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  }
});

export const { setTransactionStatus, clearTransactionError } = transactionsSlice.actions;

export default transactionsSlice.reducer;

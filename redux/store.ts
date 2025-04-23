import { configureStore } from '@reduxjs/toolkit';
import recurringTransactionsReducer from './slices/recurringTransactionsSlice';
import uiReducer from './slices/uiSlice';
import categoriesReducer from './slices/categoriesSlice';
import transactionsReducer from './slices/transactionsSlice';

/**
 * Redux store configuration
 */
export const store = configureStore({
  reducer: {
    recurringTransactions: recurringTransactionsReducer,
    ui: uiReducer,
    categories: categoriesReducer,
    transactions: transactionsReducer
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: false // Allow non-serializable values in state
    })
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

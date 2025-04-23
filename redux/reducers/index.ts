import { combineReducers } from 'redux';
import { transactionReducer } from './transactionReducer';

/**
 * Root reducer combining all reducers in the application
 */
export const rootReducer = combineReducers({
  recurringTransactions: transactionReducer
  // Add other reducers here as needed
});

export type RootState = ReturnType<typeof rootReducer>;

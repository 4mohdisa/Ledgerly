import * as types from '../actionTypes';
import { Transaction } from '@/app/types/transaction';

// Define the state interface
interface TransactionState {
  upcomingTransactions: Transaction[];
  upcomingStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  upcomingError: string | null;
  lastFetched: number | null;
}

// Initial state
const initialState: TransactionState = {
  upcomingTransactions: [],
  upcomingStatus: 'idle',
  upcomingError: null,
  lastFetched: null
};

// Action interface
interface TransactionAction {
  type: string;
  payload?: any;
}

/**
 * Reducer for handling transaction-related actions
 */
export const transactionReducer = (
  state: TransactionState = initialState, 
  action: TransactionAction
): TransactionState => {
  switch (action.type) {
    case types.FETCH_UPCOMING_TRANSACTIONS_REQUEST:
      return {
        ...state,
        upcomingStatus: 'loading'
      };
      
    case types.FETCH_UPCOMING_TRANSACTIONS_SUCCESS:
      return {
        ...state,
        upcomingTransactions: action.payload,
        upcomingStatus: 'succeeded',
        upcomingError: null,
        lastFetched: Date.now() // Store the timestamp when data was fetched
      };
      
    case types.FETCH_UPCOMING_TRANSACTIONS_FAILURE:
      return {
        ...state,
        upcomingStatus: 'failed',
        upcomingError: action.payload
      };
      
    default:
      return state;
  }
};

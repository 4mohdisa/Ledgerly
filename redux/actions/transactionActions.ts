import { Dispatch } from 'redux';
import * as types from '../actionTypes';
import { transactionService } from '@/services/transactionService';
import { Transaction } from '@/app/types/transaction';

/**
 * Action creator to fetch upcoming transactions
 * Includes caching logic to avoid unnecessary API calls
 */
export const fetchUpcomingTransactions = (userId: string, forceRefresh = false) => {
  return async (dispatch: Dispatch, getState: () => any): Promise<void> => {
    // Get current state to check if we already have data
    const { recurringTransactions } = getState();
    const { upcomingTransactions, upcomingStatus, lastFetched } = recurringTransactions;
    
    // Skip fetching if we already have data and not forcing refresh
    // Also check if the data was fetched in the last 5 minutes (300000ms)
    const hasRecentData = lastFetched && (Date.now() - lastFetched < 300000);
    if (!forceRefresh && upcomingTransactions.length > 0 && hasRecentData) {
      return;
    }
    
    // If already loading, don't dispatch another request
    if (upcomingStatus === 'loading') {
      return;
    }
    
    dispatch({ type: types.FETCH_UPCOMING_TRANSACTIONS_REQUEST });
    
    try {
      const transactions: Transaction[] = await transactionService.getUpcomingTransactions(userId);
      dispatch({ 
        type: types.FETCH_UPCOMING_TRANSACTIONS_SUCCESS, 
        payload: transactions
      });
    } catch (error) {
      dispatch({ 
        type: types.FETCH_UPCOMING_TRANSACTIONS_FAILURE, 
        payload: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  };
};

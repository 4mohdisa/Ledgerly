# Implementing Redux with Transactions Table: Quick Guide

## File Structure
```
├── redux/
│   ├── actionTypes.ts
│   ├── actions/transactionActions.ts
│   ├── reducers/
│   │   ├── index.ts
│   │   └── transactionReducer.ts
│   ├── store.ts
│   └── hooks.ts
└── services/transactionService.ts
```

## Step 1: Define Transaction Types
```typescript
// app/types/transaction.ts
export interface Transaction {
  id: string;
  name: string;
  amount: number;
  date: string;
  type: 'Income' | 'Expense';
  category_name?: string;
}

export type TransactionStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface TransactionState {
  upcomingTransactions: Transaction[];
  upcomingStatus: TransactionStatus;
  upcomingError: string | null;
}
```

## Step 2: Create Action Types
```typescript
// redux/actionTypes.ts
export const FETCH_TRANSACTIONS_REQUEST = 'FETCH_TRANSACTIONS_REQUEST';
export const FETCH_TRANSACTIONS_SUCCESS = 'FETCH_TRANSACTIONS_SUCCESS';
export const FETCH_TRANSACTIONS_FAILURE = 'FETCH_TRANSACTIONS_FAILURE';
```

## Step 3: Create Action Creators
```typescript
// redux/actions/transactionActions.ts
import * as types from '../actionTypes';
import { transactionService } from '@/services/transactionService';

export const fetchTransactions = () => async (dispatch) => {
  dispatch({ type: types.FETCH_TRANSACTIONS_REQUEST });
  
  try {
    const transactions = await transactionService.getTransactions();
    dispatch({ 
      type: types.FETCH_TRANSACTIONS_SUCCESS, 
      payload: transactions 
    });
  } catch (error) {
    dispatch({ 
      type: types.FETCH_TRANSACTIONS_FAILURE, 
      payload: error.message 
    });
  }
};
```

## Step 4: Create Transaction Service
```typescript
// services/transactionService.ts
export const transactionService = {
  getTransactions: async () => {
    const response = await fetch('/api/transactions');
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
  }
};
```

## Step 5: Create Reducer
```typescript
// redux/reducers/transactionReducer.ts
import * as types from '../actionTypes';

const initialState = {
  upcomingTransactions: [],
  upcomingStatus: 'idle',
  upcomingError: null
};

export const transactionReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.FETCH_TRANSACTIONS_REQUEST:
      return {
        ...state,
        upcomingStatus: 'loading'
      };
    case types.FETCH_TRANSACTIONS_SUCCESS:
      return {
        ...state,
        upcomingTransactions: action.payload,
        upcomingStatus: 'succeeded'
      };
    case types.FETCH_TRANSACTIONS_FAILURE:
      return {
        ...state,
        upcomingStatus: 'failed',
        upcomingError: action.payload
      };
    default:
      return state;
  }
};
```

## Step 6: Combine Reducers
```typescript
// redux/reducers/index.ts
import { combineReducers } from 'redux';
import { transactionReducer } from './transactionReducer';

export const rootReducer = combineReducers({
  recurringTransactions: transactionReducer
});

export type RootState = ReturnType<typeof rootReducer>;
```

## Step 7: Configure Store
```typescript
// redux/store.ts
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { rootReducer } from './reducers';

export const store = createStore(rootReducer, applyMiddleware(thunk));
export type AppDispatch = typeof store.dispatch;
```

## Step 8: Create Custom Hooks
```typescript
// redux/hooks.ts
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from './reducers';
import type { AppDispatch } from './store';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = useSelector;
```

## Step 9: Connect to React Component
Update your component to dispatch the action:

```tsx
// components/TransactionsTable.tsx
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchTransactions } from '@/redux/actions/transactionActions';

export function UpcomingTransactionsTable({ limit = 5 }) {
  const dispatch = useAppDispatch();
  const { upcomingTransactions, upcomingStatus } = useAppSelector(
    state => state.recurringTransactions
  );
  
  useEffect(() => {
    dispatch(fetchTransactions());
  }, [dispatch]);
  
  // Rest of component remains the same
}
```

## Step 10: Provide Store to App
```tsx
// index.tsx
import { Provider } from 'react-redux';
import { store } from './redux/store';

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);
```
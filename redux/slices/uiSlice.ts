import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LoadingState {
  [key: string]: boolean;
}

interface UIState {
  loading: LoadingState;
  dateRange: {
    from: string | null;
    to: string | null;
  };
  selectedDate: string | null;
}

const initialState: UIState = {
  loading: {
    transactions: false,
    categories: false,
    recurringTransactions: false,
    upcomingTransactions: false,
  },
  dateRange: {
    from: null,
    to: null,
  },
  selectedDate: null,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<{ key: string; value: boolean }>) => {
      const { key, value } = action.payload;
      state.loading[key] = value;
    },
    setDateRange: (state, action: PayloadAction<{ from: string | null; to: string | null }>) => {
      state.dateRange = action.payload;
    },
    setSelectedDate: (state, action: PayloadAction<string | null>) => {
      state.selectedDate = action.payload;
    },
  },
});

export const { setLoading, setDateRange, setSelectedDate } = uiSlice.actions;

export default uiSlice.reducer;

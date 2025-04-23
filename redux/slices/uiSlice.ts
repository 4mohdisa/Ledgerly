import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DateRange } from 'react-day-picker';

interface UIState {
  dateRange: DateRange | null;
  sidebarOpen: boolean;
}

const initialState: UIState = {
  dateRange: null,
  sidebarOpen: false
};

/**
 * UI slice for managing UI-related state
 */
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setDateRange: (state, action: PayloadAction<DateRange | null>) => {
      state.dateRange = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    }
  }
});

export const { setDateRange, toggleSidebar, setSidebarOpen } = uiSlice.actions;
export default uiSlice.reducer;

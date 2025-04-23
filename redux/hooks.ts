import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

/**
 * Custom hook for dispatching actions with correct typing
 */
export const useAppDispatch = (): AppDispatch => useDispatch<AppDispatch>();

/**
 * Custom hook for selecting state with correct typing
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

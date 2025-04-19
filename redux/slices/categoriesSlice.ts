import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Category } from '@/hooks/use-categories';
import { createClient } from '@/utils/supabase/client';
import { setLoading } from './uiSlice';

interface CategoriesState {
  items: Category[];
  error: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  selectedCategory: Category | null;
}

const initialState: CategoriesState = {
  items: [],
  error: null,
  status: 'idle',
  selectedCategory: null,
};

// Async thunks for categories
export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async (userId: string | number, { dispatch }) => {
    dispatch(setLoading({ key: 'categories', value: true }));
    try {
      const supabase = createClient();
      
      // Use type assertion to handle the query parameter type
      // This is necessary because Supabase's TypeScript definitions are strict about parameter types
      let { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId as any) // Use type assertion to bypass TypeScript check
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error fetching categories:', error);
        return []; // Return empty array on error
      }
      
      if (error) throw error;
      
      return data as Category[];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    } finally {
      dispatch(setLoading({ key: 'categories', value: false }));
    }
  }
);

export const createCategory = createAsyncThunk(
  'categories/createCategory',
  async (categoryData: { 
    name: string; 
    color?: string | null; 
    description?: string | null; 
    icon?: string | null; 
    is_default?: boolean | null; 
    user_id: string | number | null; 
  }, { dispatch }) => {
    dispatch(setLoading({ key: 'categories', value: true }));
    try {
      const supabase = createClient();
      
      // Prepare the data for insertion, ensuring user_id is handled correctly
      const dataToInsert = {
        ...categoryData,
        // Convert string user_id to number if needed by the database schema
        user_id: typeof categoryData.user_id === 'string' 
          ? parseInt(categoryData.user_id, 10) 
          : categoryData.user_id
      };
      
      const { data, error } = await supabase
        .from('categories')
        .insert(dataToInsert)
        .select()
        .single();
      
      if (error) throw error;
      
      return data as Category;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    } finally {
      dispatch(setLoading({ key: 'categories', value: false }));
    }
  }
);

export const updateCategory = createAsyncThunk(
  'categories/updateCategory',
  async ({ id, data }: { id: number; data: { 
    name?: string; 
    color?: string | null; 
    description?: string | null; 
    icon?: string | null; 
    is_default?: boolean | null; 
    user_id?: string | number | null; 
  } }, { dispatch }) => {
    dispatch(setLoading({ key: 'categories', value: true }));
    try {
      const supabase = createClient();
      
      // Prepare the data for update, ensuring user_id is handled correctly
      const dataToUpdate = {
        ...data,
        // Convert string user_id to number if needed by the database schema
        user_id: typeof data.user_id === 'string' 
          ? parseInt(data.user_id, 10) 
          : data.user_id
      };
      
      // Remove the id field if it exists in the data to prevent errors
      if ('id' in dataToUpdate) {
        delete (dataToUpdate as any).id;
      }
      
      const { data: updatedCategory, error } = await supabase
        .from('categories')
        .update(dataToUpdate)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return updatedCategory as Category;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    } finally {
      dispatch(setLoading({ key: 'categories', value: false }));
    }
  }
);

export const deleteCategory = createAsyncThunk(
  'categories/deleteCategory',
  async (id: number, { dispatch }) => {
    dispatch(setLoading({ key: 'categories', value: true }));
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return id;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    } finally {
      dispatch(setLoading({ key: 'categories', value: false }));
    }
  }
);

export const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    setSelectedCategory: (state, action: PayloadAction<Category | null>) => {
      state.selectedCategory = action.payload;
    },
    clearCategories: (state) => {
      state.items = [];
      state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch categories
      .addCase(fetchCategories.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch categories';
      })
      // Create category
      .addCase(createCategory.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      // Update category
      .addCase(updateCategory.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      // Delete category
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload);
      });
  },
});

export const { setSelectedCategory, clearCategories } = categoriesSlice.actions;

export default categoriesSlice.reducer;

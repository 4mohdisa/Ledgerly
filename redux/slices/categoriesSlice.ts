import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { createClient } from '@/utils/supabase/client';

// Define the Category interface
export interface Category {
  id: number;
  name: string;
  type?: string;
  user_id?: string | number | null; // Support both string and number types for user_id
  color?: string | null;
  icon?: string | null;
  description?: string | null;
  is_default?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// Define the raw database type for proper type assertions
interface RawCategoryData {
  id: number;
  name: string;
  type?: string;
  user_id: string | number | null;
  color: string | null;
  icon: string | null;
  description: string | null;
  is_default: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  [key: string]: any; // Allow for additional properties
}

// Define the state interface
interface CategoriesState {
  items: Category[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  lastFetched: number | null;
}

// Initial state
const initialState: CategoriesState = {
  items: [],
  status: 'idle',
  error: null,
  lastFetched: null
};

/**
 * Fetch categories
 */
export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async (userId: string) => {
    const supabase = createClient();
    
    // Fetch all categories without filtering by user_id
    // We want to show all categories in the dropdown
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
      
    // Handle potential null data
    if (!data) {
      return [];
    }
      
    if (error) {
      // Handle error with proper type checking using a type assertion
      // This is safe because we've already checked that error exists
      const errorObj = error as { message?: string };
      const errorMessage = errorObj.message || 'Unknown error fetching categories';
      throw new Error(errorMessage);
    }
    
    // Use all categories without filtering
    const typedData = data as RawCategoryData[];
    console.log(`Retrieved ${typedData.length} categories from database via Redux`);
    
    // Convert the data to match our Category interface
    return typedData.map((item: RawCategoryData) => {
      // Create a properly typed Category object
      const category: Category = {
        id: item.id,
        name: item.name,
        // Only include type if it exists in the item
        ...(item.type !== undefined && { type: item.type }),
        user_id: item.user_id?.toString(), // Convert to string for consistency
        color: item.color,
        icon: item.icon,
        description: item.description,
        is_default: item.is_default,
        created_at: item.created_at,
        updated_at: item.updated_at
      };
      return category;
    });
  }
);

/**
 * Create category
 */
export const createCategory = createAsyncThunk(
  'categories/createCategory',
  async (category: Partial<Category>) => {
    const supabase = createClient();
    
    // Ensure user_id is properly formatted for the database
    // If it's a string (UUID), try to convert it to a number if possible
    const preparedCategory = { ...category };
    if (typeof preparedCategory.user_id === 'string') {
      // If it's a UUID, leave it as string
      // If it's a numeric string, convert to number
      if (/^\d+$/.test(preparedCategory.user_id)) {
        preparedCategory.user_id = parseInt(preparedCategory.user_id, 10);
      }
    }
    
    const { data, error } = await supabase
      .from('categories')
      .insert(preparedCategory as any)
      .select('*')
      .single();
      
    if (error) {
      // Handle error with proper type checking using a type assertion
      // This is safe because we've already checked that error exists
      const errorObj = error as { message?: string };
      const errorMessage = errorObj.message || 'Unknown error fetching categories';
      throw new Error(errorMessage);
    }
    
    // Convert the data to match our Category interface
    // Use a safer approach with explicit type casting
    const typedData = data as RawCategoryData;
    const result: Category = {
      id: typedData.id,
      name: typedData.name,
      // Only include type if it exists in the data
      ...(typedData.type !== undefined && { type: typedData.type }),
      user_id: typedData.user_id?.toString(), // Convert to string for consistency
      color: typedData.color,
      icon: typedData.icon,
      description: typedData.description,
      is_default: typedData.is_default,
      created_at: typedData.created_at,
      updated_at: typedData.updated_at
    };
    
    return result;
  }
);

/**
 * Update category
 */
export const updateCategory = createAsyncThunk(
  'categories/updateCategory',
  async ({ id, data, userId }: { id: number; data: Partial<Category>; userId: string }) => {
    const supabase = createClient();
    
    // First, verify the category exists and belongs to the user
    const { data: categoryData, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      // Handle error with proper type assertion
      const errorObj = fetchError as { message?: string };
      const errorMessage = errorObj.message || 'Unknown error fetching category';
      throw new Error(errorMessage);
    }
    
    // Verify ownership by comparing string representations
    const categoryUserId = categoryData?.user_id?.toString();
    if (categoryUserId !== userId && !categoryData?.is_default) {
      throw new Error('Category not found or not owned by user');
    }
    
    // Now perform the update without the user_id filter
    const { error } = await supabase
      .from('categories')
      .update(data as any)
      .eq('id', id);
      
    if (error) {
      // Handle error with proper type assertion
      const errorObj = error as { message?: string };
      const errorMessage = errorObj.message || 'Unknown error updating category';
      throw new Error(errorMessage);
    }
    
    return { id, ...data };
  }
);

/**
 * Delete category
 */
export const deleteCategory = createAsyncThunk(
  'categories/deleteCategory',
  async ({ id, userId }: { id: number; userId: string }) => {
    const supabase = createClient();
    
    // First, verify the category exists and belongs to the user
    const { data: categoryData, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      // Handle error with proper type assertion
      const errorObj = fetchError as { message?: string };
      const errorMessage = errorObj.message || 'Unknown error fetching category';
      throw new Error(errorMessage);
    }
    
    // Verify ownership by comparing string representations
    const categoryUserId = categoryData?.user_id?.toString();
    if (categoryUserId !== userId && !categoryData?.is_default) {
      throw new Error('Category not found or not owned by user');
    }
    
    // Don't allow deletion of default categories
    if (categoryData?.is_default) {
      throw new Error('Cannot delete default categories');
    }
    
    // Now perform the delete without the user_id filter
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
      
    if (error) {
      // Handle error with proper type assertion
      const errorObj = error as { message?: string };
      const errorMessage = errorObj.message || 'Unknown error deleting category';
      throw new Error(errorMessage);
    }
    
    return id;
  }
);

/**
 * Categories slice
 */
const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch categories
      .addCase(fetchCategories.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCategories.fulfilled, (state, action: PayloadAction<Category[]>) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.lastFetched = Date.now();
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch categories';
      })
      
      // Create category
      .addCase(createCategory.fulfilled, (state, action: PayloadAction<Category>) => {
        state.items.push(action.payload);
      })
      
      // Update category
      .addCase(updateCategory.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload };
        }
      })
      
      // Delete category
      .addCase(deleteCategory.fulfilled, (state, action: PayloadAction<number>) => {
        state.items = state.items.filter(item => item.id !== action.payload);
      });
  }
});

export default categoriesSlice.reducer;

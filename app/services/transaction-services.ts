import { createClient } from '@/utils/supabase/client';
import {
  Transaction,
  RecurringTransaction,
  UpdateTransaction,
  UpdateRecurringTransaction,
  TransactionFormData,
  TransactionType,
  AccountType,
  FrequencyType,
  UpdateUpcomingTransaction
} from '@/app/types/transaction';


interface TransactionData extends Omit<Transaction, "id" | "date" | "end_date"> {
  date: string;
  end_date?: string | null;
}

class TransactionService {

  private supabase = createClient();

  private formatDate(date: string | Date | number): string {
    if (typeof date === 'string') {
      return new Date(date).toISOString().split('T')[0];
    } else if (typeof date === 'number') {
      return new Date(date).toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
  }

  async createTransaction(data: TransactionData) {
    // Validate required fields for all transactions
    if (!data.user_id) throw new Error("User ID is required");
    if (!data.date) throw new Error("Transaction date is required");
    if (!data.name) throw new Error("Transaction name is required");
    if (typeof data.amount !== "number" || data.amount <= 0)
      throw new Error("Valid transaction amount is required");

    try {
      // Prepare transaction data for the transactions table (without end_date)
      const transactionData = {
        user_id: data.user_id,
        name: data.name,
        amount: data.amount,
        date: this.formatDate(data.date),
        description: data.description || null,
        type: (data.type || "Expense") as TransactionType,
        account_type: (data.account_type || "Cash") as AccountType,
        category_id: data.category_id ? Number(data.category_id) : 1,
        recurring_frequency: (data.recurring_frequency || "Never") as FrequencyType,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Store common data for potential recurring transaction
      const recurringFrequency = (data.recurring_frequency || "Never") as FrequencyType;

      // Step 1: Always create a regular transaction
      const { data: transaction, error: transactionError } = await this.supabase
        .from("transactions")
        .insert(transactionData)
        .select()
        .single();

      if (transactionError) {
        if (transactionError.code === "23503") {
          throw new Error("Invalid category selected");
        }
        throw new Error(`Transaction creation failed: ${transactionError.message}`);
      }

      // Step 2: If recurring_frequency is not "Never", create a recurring transaction
      let recurringTransaction = null;
      if (recurringFrequency !== "Never") {
        // Create recurring transaction
        const { data: recurring, error: recurringError } = await this.supabase
          .from("recurring_transactions")
          .insert({
            user_id: data.user_id,
            name: data.name,
            amount: data.amount,
            type: (data.type || "Expense") as TransactionType,
            account_type: (data.account_type || "Cash") as AccountType,
            category_id: data.category_id ? Number(data.category_id) : 1,
            description: data.description || null,
            frequency: recurringFrequency,
            start_date: this.formatDate(data.date),
            end_date: null, // Set end_date to null since we removed it from the form
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (recurringError) {
          throw new Error(`Recurring transaction creation failed: ${recurringError.message}`);
        }

        recurringTransaction = recurring;
      }

      return { transaction, recurringTransaction };
    } catch (error) {
      console.error("Error creating transaction:", error);
      throw error;
    }
  }

  async createRecurringTransaction(data: RecurringTransaction | Omit<RecurringTransaction, 'id'>) {
    // Check if this is form data (which won't have user_id) or direct data
    const isFormData = !('user_id' in data);

    let userId: string;
    let type = data.type;
    let accountType = data.account_type;
    let frequency = (data as any).frequency || (data as any).schedule_type;

    if (isFormData) {
      // Get the current user
      const { data: authData } = await this.supabase.auth.getUser();
      if (!authData?.user?.id) {
        throw new Error('User authentication required');
      }
      userId = authData.user.id;
    } else {
      userId = (data as RecurringTransaction).user_id;
    }

    // Destructure to remove id field and create a new object without it
    const { id, ...dataWithoutId } = data as any;

    const recurringData = {
      ...dataWithoutId,
      user_id: userId,
      type: type,
      account_type: accountType,
      frequency: frequency,
      category_id: typeof data.category_id === 'string' ? parseInt(data.category_id) : (data.category_id || 1),
      start_date: this.formatDate(data.start_date),
      end_date: data.end_date ? this.formatDate(data.end_date) : null,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString()
    };

    const { data: recurringTransaction, error } = await this.supabase
      .from('recurring_transactions')
      .insert(recurringData)
      .select()
      .single();

    if (error) {
      console.error('Error creating recurring transaction:', error);
      if (error.code === '23503') { // Foreign key violation
        throw new Error('Invalid category selected');
      }
      throw error;
    }

    return recurringTransaction;
  }

  async createCombinedTransaction(formData: TransactionFormData, userId: string) {
    try {
      // Create the basic transaction data
      const transactionData: TransactionData = {
        user_id: userId,
        name: formData.name,
        amount: formData.amount,
        type: formData.type,
        account_type: formData.account_type,
        category_id: formData.category_id,
        description: formData.description,
        date: this.formatDate(formData.date),
        recurring_frequency: formData.schedule_type,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Create the transaction
      const transaction = await this.createTransaction(transactionData);

      // If it's a recurring transaction (not one-time), also create a recurring transaction entry
      if (formData.schedule_type !== 'Never') {
        const recurringData: Omit<RecurringTransaction, 'id'> = {
          user_id: userId,
          name: formData.name,
          amount: formData.amount,
          type: formData.type,
          account_type: formData.account_type,
          category_id: formData.category_id,
          description: formData.description,
          frequency: formData.schedule_type,
          start_date: this.formatDate(formData.start_date || formData.date),
          end_date: formData.end_date ? this.formatDate(formData.end_date) : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const recurringTransaction = await this.createRecurringTransaction(recurringData);

        return {
          transaction,
          recurringTransaction
        };
      }

      return { transaction };
    } catch (error) {
      console.error('Failed to create transaction:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create transaction');
    }
  }

  async updateTransaction(id: number, data: UpdateTransaction) {
    if (!id) throw new Error("Transaction ID is required");

    // Format dates if present
    const formattedData = {
      ...data,
      date: data.date ? this.formatDate(data.date) : undefined,
      updated_at: new Date().toISOString()
    };

    const { data: transaction, error } = await this.supabase
      .from("transactions")
      .update(formattedData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return transaction;
  }

  async updateRecurringTransaction(id: number, data: UpdateRecurringTransaction, userId: string) {
    // Format date fields to ensure they're strings
    const formattedData: Record<string, any> = { ...data };

    // Format start_date if present
    if (formattedData.start_date !== undefined) {
      formattedData.start_date = this.formatDate(formattedData.start_date);
    }

    // Format end_date if present and not null
    if (formattedData.end_date !== undefined && formattedData.end_date !== null) {
      formattedData.end_date = this.formatDate(formattedData.end_date);
    }

    const { data: recurringTransaction, error } = await this.supabase
      .from('recurring_transactions')
      .update(formattedData)
      .eq('id', id)
      .eq('user_id', userId.toString())
      .select()
      .single();

    if (error) throw error;

    // After updating the recurring transaction, regenerate future upcoming transactions
    await this.regenerateUpcomingTransactions(id, userId);

    return recurringTransaction;
  }

  async updateRecurringTransactionWithUpcoming(id: number, data: UpdateRecurringTransaction, userId: string) {
    try {
      // Step 1: Update the recurring transaction
      const recurringTransaction = await this.updateRecurringTransaction(id, data, userId);

      // Step 2: Delete future upcoming transactions (keep past and today)
      const today = new Date().toISOString().split('T')[0];
      const { error: deleteError } = await this.supabase
        .from('upcoming_transactions')
        .delete()
        .eq('recurring_transaction_id', id)
        .gt('date', today);

      if (deleteError) throw deleteError;

      // Step 3: Regenerate upcoming transactions for this user
      await this.generateUpcomingTransactions(userId);

      return recurringTransaction;
    } catch (error) {
      console.error('Error updating recurring transaction with upcoming:', error);
      throw error;
    }
  }

  async deleteTransaction(id: number, userId: string) {
    const { error } = await this.supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async deleteRecurringTransaction(id: number, userId: string) {
    const { error } = await this.supabase
      .from('recurring_transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async deleteRecurringTransactionWithUpcoming(id: number, userId: string) {
    try {
      // Due to the cascade delete constraint in the database,
      // deleting the recurring transaction will automatically delete
      // all associated upcoming transactions
      await this.deleteRecurringTransaction(id, userId);

      // No need to manually delete upcoming transactions due to CASCADE constraint
      // But we should regenerate the upcoming transactions for other recurring transactions
      await this.generateUpcomingTransactions(userId);
    } catch (error) {
      console.error('Error deleting recurring transaction with upcoming:', error);
      throw error;
    }
  }

  async getTransactions(userId: string, dateRange?: { from: Date; to: Date }) {
    let query = this.supabase
      .from('transactions')
      .select('*, categories(name)')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (dateRange) {
      query = query
        .gte('date', dateRange.from.toISOString().split('T')[0])
        .lte('date', dateRange.to.toISOString().split('T')[0]);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async getRecurringTransactions(userId: string | number) {
    const userIdAsString = userId.toString();
    const query = this.supabase
      .from('recurring_transactions')
      .select('*, categories(name)')
      .or(`user_id.eq.${userIdAsString},user_id.eq.${Number(userIdAsString) || 0}`)
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async getUpcomingTransactions(userId: string | number, months: number = 3) {
    try {
      console.log('Getting upcoming transactions for user:', userId);

      // First, check if there are any upcoming transactions already in the database
      // Use the 'eq' filter with the user_id column
      // Note: Supabase may expect specific types for columns, so we handle both string and number
      const userIdStr = userId.toString();
      const query = this.supabase
        .from('upcoming_transactions')
        .select('*')
        .or(`user_id.eq.${userIdStr},user_id.eq.${Number(userIdStr) || 0}`)
        .order('date');

      const { data: existingUpcoming, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching existing upcoming transactions:', fetchError);
        throw fetchError;
      }

      console.log('Existing upcoming transactions:', existingUpcoming?.length || 0);

      // Generate new upcoming transactions if we don't have at least 5
      if (!existingUpcoming || existingUpcoming.length < 5) {
        console.log('Generating new upcoming transactions...');
        await this.generateUpcomingTransactions(userId);

        // Fetch the updated list
        const { data: refreshed, error } = await this.supabase
          .from('upcoming_transactions')
          .select('*')
          .or(`user_id.eq.${userIdStr},user_id.eq.${Number(userIdStr) || 0}`)
          .order('date');

        if (error) throw error;
        return refreshed || [];
      }

      // Return existing upcoming transactions
      return existingUpcoming;
    } catch (error) {
      console.error('Error getting upcoming transactions:', error);
      throw error;
    }
  }

  async regenerateUpcomingTransactions(recurringTransactionId: number, userId: string | number) {
    try {
      // Delete existing future upcoming transactions for this recurring transaction
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { error: deleteError } = await this.supabase
        .from('upcoming_transactions')
        .delete()
        .eq('recurring_transaction_id', recurringTransactionId)
        .gte('date', today.toISOString().split('T')[0]);

      if (deleteError) {
        console.error('Error deleting future upcoming transactions:', deleteError);
        throw deleteError;
      }

      // Get the recurring transaction details
      const { data: rt, error: fetchError } = await this.supabase
        .from('recurring_transactions')
        .select('*, categories(name)')
        .eq('id', recurringTransactionId)
        .eq('user_id', userId.toString())
        .single();

      if (fetchError) {
        console.error('Error fetching recurring transaction:', fetchError);
        throw fetchError;
      }

      if (!rt) {
        console.log('No recurring transaction found with ID:', recurringTransactionId);
        return;
      }

      // Generate next 5 upcoming transactions
      const startDate = new Date(rt.start_date);
      const endDate = rt.end_date ? new Date(rt.end_date) : undefined;

      // Use the helper function to get the next 5 dates
      const nextDates = this.getNextDates(startDate, rt.frequency, 5, endDate);
      console.log(`Generated ${nextDates.length} future dates for recurring transaction ${rt.id}`);

      // Create the upcoming transactions
      for (const date of nextDates) {
        const dateStr = date.toISOString().split('T')[0];

        const { error: insertError } = await this.supabase.from('upcoming_transactions').insert({
          recurring_transaction_id: rt.id,
          user_id: Number(userId),  // Convert to number as required by the schema
          category_id: rt.category_id,
          category_name: rt.categories?.name || rt.category_name || 'Uncategorized',
          date: dateStr,
          amount: rt.amount,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        if (insertError) {
          console.error('Error inserting upcoming transaction:', insertError);
        }
      }
    } catch (error) {
      console.error('Error regenerating upcoming transactions:', error);
      throw error;
    }
  }


  async generateUpcomingTransactions(userId: string | number) {
    try {
      console.log('Generating upcoming transactions for user:', userId);
      
      // Process past-due transactions first
      await this.convertPastDueTransactions(userId.toString());
      
      // Get all recurring transactions for the user
      const recurringTransactions = await this.getRecurringTransactions(userId);
      if (!recurringTransactions || recurringTransactions.length === 0) {
        console.log('No recurring transactions found for user:', userId);
        return [];
      }

      console.log('Found recurring transactions:', recurringTransactions.length);
      
      // Get existing upcoming transactions to avoid duplicates
      const { data: existingUpcoming, error: fetchError } = await this.supabase
        .from('upcoming_transactions')
        .select('id, recurring_transaction_id, date')
        .eq('user_id', Number(userId));  // upcoming_transactions.user_id is a number
        
      if (fetchError) {
        console.error('Error fetching existing upcoming transactions:', fetchError);
        throw fetchError;
      }
      
      // Create a map of existing transactions for quick lookup
      const existingMap = new Map();
      (existingUpcoming || []).forEach(tx => {
        const key = `${tx.recurring_transaction_id}-${tx.date}`;
        existingMap.set(key, tx.id);
      });
      
      // Process each recurring transaction
      for (const rt of recurringTransactions) {
        const startDate = new Date(rt.start_date);
        const endDate = rt.end_date ? new Date(rt.end_date) : undefined;
        
        // Use the helper function to get the next 5 dates
        const nextDates = this.getNextDates(startDate, rt.frequency, 5, endDate);
        
        // Find how many upcoming transactions we need to create for this recurring transaction
        const upcomingCount = (existingUpcoming || []).filter(
          tx => tx.recurring_transaction_id === rt.id
        ).length;
        
        // Only create new transactions if we have fewer than 5
        if (upcomingCount >= 5) continue;
        
        // Insert each future date into upcoming_transactions
        const newTransactions = [];
        for (const date of nextDates) {
          const dateStr = date.toISOString().split('T')[0];
          const key = `${rt.id}-${dateStr}`;
          
          // Skip if this transaction already exists
          if (existingMap.has(key)) continue;
          
          newTransactions.push({
            recurring_transaction_id: rt.id,
            user_id: Number(userId),  // Convert string userId to number
            category_id: rt.category_id,
            category_name: rt.categories?.name || rt.category_name || 'Uncategorized',
            date: dateStr,
            amount: rt.amount,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
        
        // Bulk insert new transactions if any
        if (newTransactions.length > 0) {
          const { error: insertError } = await this.supabase
            .from('upcoming_transactions')
            .insert(newTransactions);
            
          if (insertError) {
            console.error('Error inserting upcoming transactions:', insertError);
            throw insertError;
          }
        }
      }

      // Fetch all upcoming transactions for display
      const { data: upcoming, error: refreshError } = await this.supabase
        .from('upcoming_transactions')
        .select('*')
        .eq('user_id', Number(userId))
        .order('date');
        
      if (refreshError) {
        console.error('Error fetching upcoming transactions after generation:', refreshError);
        throw refreshError;
      }
      
      return upcoming || [];
    } catch (error) {
      console.error('Error generating upcoming transactions:', error);
      throw error;
    }
  }

  async convertPastDueTransactions(userId: string | number) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all past-due upcoming transactions
      const { data: pastDue, error: fetchError } = await this.supabase
        .from('upcoming_transactions')
        .select('*')
        .eq('user_id', Number(userId))  // upcoming_transactions.user_id is a number
        .lt('date', today.toISOString().split('T')[0]);

      if (fetchError) {
        console.error('Error fetching past-due transactions:', fetchError);
        throw fetchError;
      }

      if (!pastDue || pastDue.length === 0) {
        console.log('No past-due transactions found');
        return;
      }

      console.log(`Found ${pastDue.length} past-due transactions to convert`);

      // Convert each past-due transaction
      for (const tx of pastDue) {
        // Get the recurring transaction to get additional details if available
        let recurringTx = null;
        if (tx.recurring_transaction_id) {
          const { data: rtData } = await this.supabase
            .from('recurring_transactions')
            .select('*')
            .eq('id', tx.recurring_transaction_id)
            .single();

          recurringTx = rtData;
        }

        // Insert into transactions table
        const { error: insertError } = await this.supabase.from('transactions').insert({
          user_id: userId.toString(),  // transactions.user_id is a string
          date: tx.date,
          amount: tx.amount,
          name: recurringTx?.name || `${tx.category_name || 'Uncategorized'} Payment`,
          description: recurringTx?.description || '',
          type: recurringTx?.type || 'expense',
          account_type: recurringTx?.account_type || 'Checking',
          category_id: tx.category_id,
          category_name: tx.category_name || 'Uncategorized',
          recurring_frequency: 'Never',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        if (insertError) {
          console.error('Error inserting transaction:', insertError);
          continue;
        }

        // Delete from upcoming_transactions
        const { error: deleteError } = await this.supabase
          .from('upcoming_transactions')
          .delete()
          .eq('id', tx.id);

        if (deleteError) {
          console.error('Error deleting upcoming transaction:', deleteError);
        }
      }
    } catch (error) {
      console.error('Error converting past-due transactions:', error);
      throw error;
    }
  }

  /**
   * Updates an upcoming transaction
   */
  async updateUpcomingTransaction(id: number, data: UpdateUpcomingTransaction, userId: string) {
    try {
      // Only include fields that exist in the upcoming_transactions table
      const { error } = await this.supabase
        .from('upcoming_transactions')
        .update({
          amount: data.amount,
          category_id: data.category_id,
          category_name: data.category_name,
          updated_at: new Date().toISOString()
          // Removed fields that don't exist in schema: name, description, type, account_type
        })
        .eq('id', id)
        .eq('user_id', Number(userId));
        
      if (error) {
        console.error('Error updating upcoming transaction:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error updating upcoming transaction:', error);
      throw error;
    }
  }

    /**
   * Deletes an upcoming transaction
   */
    async deleteUpcomingTransaction(id: number, userId: string) {
      try {
        const { error } = await this.supabase
          .from('upcoming_transactions')
          .delete()
          .eq('id', id)
          .eq('user_id', Number(userId));
          
        if (error) {
          console.error('Error deleting upcoming transaction:', error);
          throw error;
        }
      } catch (error) {
        console.error('Error deleting upcoming transaction:', error);
        throw error;
      }
    }


    /**
   * Helper function to calculate the next 'count' future dates based on frequency.
   * @param startDate - The starting date of the recurring transaction.
   * @param frequency - The frequency (e.g., 'Daily', 'Weekly', 'Monthly').
   * @param count - Number of future dates to generate (e.g., 5).
   * @param endDate - Optional end date; no dates beyond this will be generated.
   * @returns Array of future Date objects.
   */
  private getNextDates(startDate: Date, frequency: string, count: number, endDate?: Date): Date[] {
    const dates: Date[] = [];
    let current = new Date(startDate);
    const today = new Date();
    current.setHours(0, 0, 0, 0); // Normalize to start of day
    today.setHours(0, 0, 0, 0);

    // We'll calculate up to 20 dates, but only return the ones after today
    // This handles cases where the start date is far in the past
    let iterations = 0;
    const maxIterations = count * 20; // A reasonable limit to prevent infinite loops

    while (dates.length < count && iterations < maxIterations) {
      iterations++;
      
      // If current date is in the future and before end date (if specified)
      if (current >= today && (!endDate || current <= endDate)) {
        dates.push(new Date(current));
      }
      
      // Advance to next date based on frequency
      switch (frequency) {
        case 'Daily':
          current.setDate(current.getDate() + 1);
          break;
        case 'Weekly':
          current.setDate(current.getDate() + 7);
          break;
        case 'Bi-Weekly':
          current.setDate(current.getDate() + 14);
          break;
        case 'Tri-Weekly':
          current.setDate(current.getDate() + 21);
          break;
        case 'Monthly':
          current.setMonth(current.getMonth() + 1);
          break;
        case 'Bi-Monthly':
          current.setMonth(current.getMonth() + 2);
          break;
        case 'Quarterly':
          current.setMonth(current.getMonth() + 3);
          break;
        case 'Semi-Annually':
          current.setMonth(current.getMonth() + 6);
          break;
        case 'Annually':
          current.setFullYear(current.getFullYear() + 1);
          break;
        default:
          console.warn(`Unsupported frequency: ${frequency}, falling back to Monthly`);
          current.setMonth(current.getMonth() + 1);
      }
      
      // Break if we've passed the end date
      if (endDate && current > endDate) break;
    }
    
    return dates;
  }
}

// Create a singleton instance of the service
const transactionService = new TransactionService();

// Export as both default and named export to maintain backward compatibility
export { transactionService };
export default transactionService;
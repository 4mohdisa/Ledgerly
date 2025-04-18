import { createClient } from '@/utils/supabase/client';
import { 
  Transaction, 
  RecurringTransaction, 
  UpdateTransaction, 
  UpdateRecurringTransaction,
  TransactionFormData,
  TransactionType,
  AccountType,
  FrequencyType
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

  async updateRecurringTransaction(id: number, data: UpdateRecurringTransaction, userId: string | number) {
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
    
    // No need to regenerate upcoming transactions as they're now calculated on-demand
    
    return recurringTransaction;
  }

  async updateRecurringTransactionWithUpcoming(id: number, data: UpdateRecurringTransaction, userId: string | number) {
    try {
      // Simply update the recurring transaction - no need to manage upcoming transactions in the database
      const recurringTransaction = await this.updateRecurringTransaction(id, data, userId);
      return recurringTransaction;
    } catch (error) {
      console.error('Error updating recurring transaction:', error);
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

  async deleteRecurringTransaction(id: number, userId: string | number) {
    const { error } = await this.supabase
      .from('recurring_transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId.toString());

    if (error) throw error;
  }
  
  async deleteRecurringTransactionWithUpcoming(id: number, userId: string) {
    try {
      // Simply delete the recurring transaction - no need to manage upcoming transactions in the database
      await this.deleteRecurringTransaction(id, userId);
    } catch (error) {
      console.error('Error deleting recurring transaction:', error);
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

  /**
   * Generates actual transactions from recurring transactions that are due (today or past)
   * @param userId The user ID
   * @param recurringTransactions Optional list of recurring transactions (if already fetched)
   * @returns Array of newly created transactions
   */
  async generateDueTransactions(userId: string | number, recurringTransactions?: any[]) {
    try {
      console.log('Generating due transactions for user:', userId);

      if (!userId) {
        console.error('Cannot generate due transactions: userId is null or undefined');
        return [];
      }

      // If recurring transactions weren't provided, fetch them
      const transactions = recurringTransactions || await this.getRecurringTransactions(userId);
      
      if (!transactions || transactions.length === 0) {
        console.log('No recurring transactions found for user:', userId);
        return [];
      }

      console.log('Found recurring transactions:', transactions.length);
      
      // Get today's date (normalized to start of day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      
      // Track newly created transactions
      const createdTransactions = [];
      
      // Process each recurring transaction
      for (const rt of transactions) {
        const startDate = new Date(rt.start_date);
        const endDate = rt.end_date ? new Date(rt.end_date) : undefined;
        
        // Skip if the start date is in the future
        if (startDate > today) {
          continue;
        }
        
        // Skip if the end date is in the past
        if (endDate && endDate < today) {
          continue;
        }
        
        // Calculate the next occurrence date that should have happened by today
        const nextDate = this.getNextDueDate(startDate, rt.frequency, today);
        
        // If we found a date that should have occurred by today
        if (nextDate && nextDate <= today) {
          // Check if this transaction already exists in the database
          const dateStr = nextDate.toISOString().split('T')[0];
          
          const { data: existingTransactions, error: checkError } = await this.supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId.toString())
            .eq('recurring_transaction_id', rt.id)
            .eq('date', dateStr);
            
          if (checkError) {
            console.error('Error checking for existing transaction:', checkError);
            continue;
          }
          
          // Only create the transaction if it doesn't already exist
          if (!existingTransactions || existingTransactions.length === 0) {
            // Create the actual transaction
            const transactionData = {
              user_id: userId.toString(),
              recurring_transaction_id: rt.id,
              name: rt.name,
              amount: rt.amount,
              date: dateStr,
              description: rt.description,
              type: rt.type,
              account_type: rt.account_type,
              category_id: rt.category_id,
              recurring_frequency: rt.frequency,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            const { data: newTransaction, error: insertError } = await this.supabase
              .from('transactions')
              .insert(transactionData)
              .select()
              .single();
              
            if (insertError) {
              console.error('Error creating transaction from recurring transaction:', insertError);
              continue;
            }
            
            if (newTransaction) {
              console.log(`Created transaction for recurring transaction ${rt.id} on date ${dateStr}`);
              createdTransactions.push(newTransaction);
            }
          } else {
            console.log(`Transaction for recurring transaction ${rt.id} on date ${dateStr} already exists`);
          }
        }
      }
      
      return createdTransactions;
    } catch (error) {
      console.error('Error generating due transactions:', error);
      throw error;
    }
  }
  
  /**
   * Helper function to find the most recent due date for a recurring transaction
   * @param startDate The start date of the recurring transaction
   * @param frequency The frequency type (Daily, Weekly, etc.)
   * @param targetDate The target date (usually today) to compare against
   * @returns The most recent due date that should have occurred by the target date
   */
  private getNextDueDate(startDate: Date, frequency: string, targetDate: Date): Date | null {
    // Normalize dates to start of day
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    
    // If the start date is in the future, there's no due date yet
    if (start > target) {
      return null;
    }
    
    // If the start date is today, that's the due date
    if (start.getTime() === target.getTime()) {
      return start;
    }
    
    // Calculate the time difference in days
    const diffTime = target.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    let dueDate = new Date(start);
    
    // Calculate the next due date based on frequency
    switch (frequency) {
      case 'Daily':
        // The due date is today
        return target;
        
      case 'Weekly':
        // Calculate how many weeks have passed
        const weeks = Math.floor(diffDays / 7);
        dueDate.setDate(start.getDate() + (weeks * 7));
        break;
        
      case 'Bi-Weekly':
        // Calculate how many 2-week periods have passed
        const biWeeks = Math.floor(diffDays / 14);
        dueDate.setDate(start.getDate() + (biWeeks * 14));
        break;
        
      case 'Tri-Weekly':
        // Calculate how many 3-week periods have passed
        const triWeeks = Math.floor(diffDays / 21);
        dueDate.setDate(start.getDate() + (triWeeks * 21));
        break;
        
      case 'Monthly':
        // Calculate how many months have passed
        let months = 0;
        dueDate = new Date(start);
        while (true) {
          dueDate.setMonth(start.getMonth() + months);
          if (dueDate > target) {
            dueDate.setMonth(start.getMonth() + months - 1);
            break;
          }
          months++;
        }
        break;
        
      case 'Bi-Monthly':
        // Calculate how many 2-month periods have passed
        let biMonths = 0;
        dueDate = new Date(start);
        while (true) {
          dueDate.setMonth(start.getMonth() + (biMonths * 2));
          if (dueDate > target) {
            dueDate.setMonth(start.getMonth() + (biMonths - 1) * 2);
            break;
          }
          biMonths++;
        }
        break;
        
      case 'Quarterly':
        // Calculate how many quarters have passed
        let quarters = 0;
        dueDate = new Date(start);
        while (true) {
          dueDate.setMonth(start.getMonth() + (quarters * 3));
          if (dueDate > target) {
            dueDate.setMonth(start.getMonth() + (quarters - 1) * 3);
            break;
          }
          quarters++;
        }
        break;
        
      case 'Semi-Annually':
        // Calculate how many half-years have passed
        let halfYears = 0;
        dueDate = new Date(start);
        while (true) {
          dueDate.setMonth(start.getMonth() + (halfYears * 6));
          if (dueDate > target) {
            dueDate.setMonth(start.getMonth() + (halfYears - 1) * 6);
            break;
          }
          halfYears++;
        }
        break;
        
      case 'Annually':
        // Calculate how many years have passed
        let years = 0;
        dueDate = new Date(start);
        while (true) {
          dueDate.setFullYear(start.getFullYear() + years);
          if (dueDate > target) {
            dueDate.setFullYear(start.getFullYear() + years - 1);
            break;
          }
          years++;
        }
        break;
        
      default:
        console.warn(`Unsupported frequency: ${frequency}, falling back to Monthly`);
        // Fallback to monthly
        let fallbackMonths = 0;
        dueDate = new Date(start);
        while (true) {
          dueDate.setMonth(start.getMonth() + fallbackMonths);
          if (dueDate > target) {
            dueDate.setMonth(start.getMonth() + fallbackMonths - 1);
            break;
          }
          fallbackMonths++;
        }
    }
    
    // If the calculated due date is in the future, it's not due yet
    if (dueDate > target) {
      return null;
    }
    
    return dueDate;
  }

  /**
   * Predicts upcoming transactions based on recurring transactions without database integration
   * @param userId The user ID
   * @param recurringTransactions Optional list of recurring transactions (if already fetched)
   * @param count Number of upcoming transactions to predict per recurring transaction (default: 2)
   * @returns Array of predicted upcoming transactions
   */
  async predictUpcomingTransactions(userId: string | number, recurringTransactions?: any[], count: number = 2) {
    try {
      console.log('Predicting upcoming transactions for user:', userId);

      if (!userId) {
        console.error('Cannot predict upcoming transactions: userId is null or undefined');
        return [];
      }

      // If recurring transactions weren't provided, fetch them
      const transactions = recurringTransactions || await this.getRecurringTransactions(userId);
      
      if (!transactions || transactions.length === 0) {
        console.log('No recurring transactions found for user:', userId);
        return [];
      }

      console.log('Found recurring transactions:', transactions.length);
      
      // Generate predicted upcoming transactions
      const predictedTransactions = [];
      
      for (const rt of transactions) {
        const startDate = new Date(rt.start_date);
        const endDate = rt.end_date ? new Date(rt.end_date) : undefined;
        
        // Use the helper function to get the next 'count' dates
        const nextDates = this.getNextDates(startDate, rt.frequency, count, endDate);
        
        // Create predicted upcoming transactions
        for (const date of nextDates) {
          const dateStr = date.toISOString().split('T')[0];
          
          // Create a predicted upcoming transaction
          predictedTransactions.push({
            id: `${rt.id}-${dateStr}`, // Generate a predictable ID
            recurring_transaction_id: rt.id,
            user_id: userId,
            category_id: rt.category_id,
            category_name: rt.categories?.name || rt.category_name || 'Uncategorized',
            date: dateStr,
            amount: rt.amount,
            type: rt.type,
            name: rt.name,
            account_type: rt.account_type,
            description: rt.description,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            predicted: true // Flag to indicate this is a predicted transaction
          });
        }
      }
      
      // Sort by date
      predictedTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      return predictedTransactions;
    } catch (error) {
      console.error('Error predicting upcoming transactions:', error);
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
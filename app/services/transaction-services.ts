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

  private formatDate(date: string | Date): string {
    if (typeof date === 'string') {
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
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return recurringTransaction;
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

  async getRecurringTransactions(userId: string) {
    const { data, error } = await this.supabase
      .from('recurring_transactions')
      .select('*, categories(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}

// Create a singleton instance of the service
const transactionService = new TransactionService();

// Export as both default and named export to maintain backward compatibility
export { transactionService };
export default transactionService;
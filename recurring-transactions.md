# Implementation in Next.js with Supabase

Recurring transactions are stored in a recurring_transactions table, generating up to five future instances in the upcoming_transactions table for user visibility. Users can edit or delete these upcoming entries. When a due date arrives, an upcoming transaction converts to a regular entry in the transactions table and is removed from upcoming_transactions. Leveraging Supabase's real-time subscriptions, this conversion happens instantly, ensuring seamless updates. Past-due transactions are also processed automatically. Edits to recurring transactions only impact future instances, preserving historical data. By limiting upcoming transactions to five, the system optimizes performance while maintaining flexibility. This approach combines real-time data handling with a user-friendly interface, providing an effective solution for managing recurring financial events.

Below is how we can implement this based on our current getUpcomingTransactions function, the Supabase API docs, and our requirements.

## 1. Generating Upcoming Transactions

Update our getUpcomingTransactions function to generate 5 transactions in advance per recurring transaction and store them in the upcoming_transactions table.

```typescript
async function getUpcomingTransactions(userId: string) {
  try {
    const supabase = createClient(); // Assume this is your Supabase client setup
    const today = new Date();
    const upcomingTransactions = [];

    // Fetch recurring transactions for the user
    const { data: recurringTransactions, error: recurringError } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('user_id', userId);

    if (recurringError) throw recurringError;
    if (!recurringTransactions || recurringTransactions.length === 0) return [];

    for (const rt of recurringTransactions) {
      const startDate = new Date(rt.start_date);
      let currentDate = new Date(Math.max(startDate.getTime(), today.getTime()));
      let count = 0;

      // Generate 5 upcoming transactions
      while (count < 5 && (!rt.end_date || currentDate <= new Date(rt.end_date))) {
        const dateStr = currentDate.toISOString().split('T')[0];

        // Check if this occurrence already exists
        const { data: existing, error: checkError } = await supabase
          .from('upcoming_transactions')
          .select('id')
          .eq('recurring_transaction_id', rt.id)
          .eq('date', dateStr);

        if (checkError) throw checkError;

        if (!existing.length) {
          upcomingTransactions.push({
            recurring_transaction_id: rt.id,
            user_id: rt.user_id,
            category_id: rt.category_id,
            category_name: rt.category_name || 'Uncategorized',
            date: dateStr,
            amount: rt.amount,
            type: rt.type,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }

        // Increment date based on frequency
        switch (rt.frequency) {
          case 'Daily':
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case 'Weekly':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'Bi-Weekly':
            currentDate.setDate(currentDate.getDate() + 14);
            break;
          case 'Monthly':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
          case 'Quarterly':
            currentDate.setMonth(currentDate.getMonth() + 3);
            break;
          case 'Semi-Annually':
            currentDate.setMonth(currentDate.getMonth() + 6);
            break;
          case 'Annually':
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            break;
          default:
            break;
        }
        count++;
      }
    }

    // Insert new upcoming transactions into Supabase
    if (upcomingTransactions.length > 0) {
      const { error: insertError } = await supabase
        .from('upcoming_transactions')
        .insert(upcomingTransactions);
      if (insertError) throw insertError;
    }

    // Fetch all upcoming transactions for display
    const { data: upcoming, error: fetchError } = await supabase
      .from('upcoming_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (fetchError) throw fetchError;
    return upcoming || [];
  } catch (error) {
    console.error('Error generating upcoming transactions:', error);
    throw error;
  }
}
```

**Key Changes:** Limits generation to 5 transactions per recurring transaction, uses Supabase to persist data, and checks for duplicates to avoid redundant entries.

## 2. Real-Time Conversion

Use Supabase's real-time subscriptions in a Next.js useEffect hook to convert upcoming_transactions to transactions instantly when their date is today or past due.

```typescript
import { useEffect } from 'react';
import { createClient } from '@/utils/supabase-client'; // Adjust path as needed

function TransactionConverter({ userId }) {
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('upcoming_transactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'upcoming_transactions' }, async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const transaction = payload.new;
          if (new Date(transaction.date) <= new Date()) {
            await convertToTransaction(transaction);
          }
        }
      })
      .subscribe();

    // Initial check for existing past-due transactions
    checkAndConvertPastDue(userId);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  async function convertToTransaction(upcomingTransaction) {
    const supabase = createClient();
    const { error: insertError } = await supabase.from('transactions').insert({
      user_id: upcomingTransaction.user_id,
      date: upcomingTransaction.date,
      amount: upcomingTransaction.amount,
      name: upcomingTransaction.name,
      description: upcomingTransaction.description,
      type: upcomingTransaction.type,
      account_type: upcomingTransaction.account_type,
      category_id: upcomingTransaction.category_id,
      category_name: upcomingTransaction.category_name,
      recurring_frequency: 'Never',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (!insertError) {
      await supabase.from('upcoming_transactions').delete().eq('id', upcomingTransaction.id);
    } else {
      console.error('Error converting transaction:', insertError);
    }
  }

  async function checkAndConvertPastDue(userId) {
    const supabase = createClient();
    const { data: pastDue, error } = await supabase
      .from('upcoming_transactions')
      .select('*')
      .eq('user_id', userId)
      .lte('date', new Date().toISOString().split('T')[0]);

    if (error) {
      console.error('Error fetching past-due transactions:', error);
      return;
    }

    for (const transaction of pastDue) {
      await convertToTransaction(transaction);
    }
  }

  return null; // This is a utility component
}

export default TransactionConverter;
```

**Usage:** Include `<TransactionConverter userId={userId} />` in your app's main component.

**Error Handling:** The initial checkAndConvertPastDue ensures missed conversions are caught when the app loads.

## 3. Handling Edits to Recurring Transactions

When a recurring_transaction is edited, update it and regenerate only future upcoming_transactions.

```typescript
async function updateRecurringTransaction(id, updates) {
  try {
    const supabase = createClient();

    // Update the recurring transaction
    const { error: updateError } = await supabase
      .from('recurring_transactions')
      .update(updates)
      .eq('id', id);

    if (updateError) throw updateError;

    // Delete future upcoming transactions (keep past and today)
    const today = new Date().toISOString().split('T')[0];
    const { error: deleteError } = await supabase
      .from('upcoming_transactions')
      .delete()
      .eq('recurring_transaction_id', id)
      .gt('date', today);

    if (deleteError) throw deleteError;

    // Regenerate upcoming transactions for this recurring transaction
    const { data: recurring, error: fetchError } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    await getUpcomingTransactions(recurring.user_id); // This will regenerate for all, refine if needed
  } catch (error) {
    console.error('Error updating recurring transaction:', error);
    throw error;
  }
}
```

## Summary

 - Generation: 5 upcoming_transactions are generated per recurring_transaction.
 - Conversion: Real-time using Supabase subscriptions, with a fallback for missed conversions.
 - Edits: Only future upcoming_transactions are updated after editing a recurring_transaction.
 - Frequencies: Standard frequencies only, no special handling.
 - Error Handling: Past-due transactions are converted on app load or when detected.

## SQL Definition of upcoming_transactions

``SQL
create table public.upcoming_transactions (
  id bigint generated always as identity not null,
  recurring_transaction_id bigint null,
  user_id bigint null,
  category_name text null,
  category_id bigint null,
  date date not null,
  amount numeric not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint upcoming_transactions_pkey primary key (id),
  constraint upcoming_transactions_category_id_fkey foreign KEY (category_id) references categories (id) on delete set null,
  constraint upcoming_transactions_recurring_transaction_id_fkey foreign KEY (recurring_transaction_id) references recurring_transactions (id) on delete CASCADE
) TABLESPACE pg_default;
``



**Note:** This regenerates all upcoming_transactions for the user. For efficiency, you could isolate regeneration to just the edited recurring_transaction.
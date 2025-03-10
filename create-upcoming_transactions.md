# Function Implementation for Generating Upcoming Transactions

Below is a complete implementation of a function that generates five future upcoming transactions for each recurring transaction in your Supabase database. This solution is designed to integrate with your existing setup, handle various frequencies, prevent duplicates, and ensure only future dates are considered.

## Function Implementation

### Overview

The function `generateUpcomingTransactions`:
- Fetches all recurring transactions for a given user from the `recurring_transactions` table.
- For each recurring transaction, calculates the next five future dates based on its frequency.
- Inserts these dates as new records into the `upcoming_transactions` table, skipping any duplicates.

Here's the full code:

```typescript
import { createClient } from '@/utils/supabase/client';

/**
 * Helper function to calculate the next 'count' future dates based on frequency.
 * @param startDate - The starting date of the recurring transaction.
 * @param frequency - The frequency (e.g., 'Daily', 'Weekly', 'Monthly').
 * @param count - Number of future dates to generate (e.g., 5).
 * @param endDate - Optional end date; no dates beyond this will be generated.
 * @returns Array of future Date objects.
 */
function getNextDates(startDate: Date, frequency: string, count: number, endDate?: Date): Date[] {
  const dates: Date[] = [];
  let current = new Date(startDate);
  const today = new Date();
  current.setHours(0, 0, 0, 0); // Normalize to start of day
  today.setHours(0, 0, 0, 0);

  while (dates.length < count) {
    if (current > today && (!endDate || current <= endDate)) {
      dates.push(new Date(current));
    }
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
      case 'Monthly':
        current.setMonth(current.getMonth() + 1);
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
        throw new Error(`Unsupported frequency: ${frequency}`);
    }
    if (endDate && current > endDate) break;
  }
  return dates;
}

/**
 * Generates the next 5 future upcoming transactions for each recurring transaction.
 * @param userId - The ID of the user whose transactions are being processed.
 */
export async function generateUpcomingTransactions(userId: string) {
  const supabase = createClient();

  try {
    // Fetch all recurring transactions for the user
    const { data: recurringTransactions, error: recurringError } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('user_id', userId);

    if (recurringError) {
      console.error('Error fetching recurring transactions:', recurringError);
      return;
    }

    if (!recurringTransactions || recurringTransactions.length === 0) {
      console.log('No recurring transactions found for this user.');
      return;
    }

    // Process each recurring transaction
    for (const rt of recurringTransactions) {
      const startDate = new Date(rt.start_date);
      const endDate = rt.end_date ? new Date(rt.end_date) : undefined;
      const nextDates = getNextDates(startDate, rt.frequency, 5, endDate);

      // Insert each future date into upcoming_transactions
      for (const date of nextDates) {
        const dateStr = date.toISOString().split('T')[0];

        // Check for existing entry to prevent duplicates
        const { data: existing, error: checkError } = await supabase
          .from('upcoming_transactions')
          .select('id')
          .eq('recurring_transaction_id', rt.id)
          .eq('date', dateStr);

        if (checkError) {
          console.error('Error checking existing upcoming transaction:', checkError);
          continue;
        }

        if (existing.length === 0) {
          // Insert new upcoming transaction
          const { error: insertError } = await supabase.from('upcoming_transactions').insert({
            recurring_transaction_id: rt.id,
            user_id: rt.user_id,
            category_id: rt.category_id,
            category_name: rt.category_name || 'Uncategorized',
            date: dateStr,
            amount: rt.amount,
            type: rt.type,
            account_type: rt.account_type,
            description: rt.description,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          if (insertError) {
            console.error('Error inserting upcoming transaction:', insertError);
          } else {
            console.log(`Inserted upcoming transaction for ${dateStr}`);
          }
        } else {
          console.log(`Upcoming transaction for ${dateStr} already exists. Skipping.`);
        }
      }
    }
  } catch (error) {
    console.error('Error generating upcoming transactions:', error);
  }
}
```

## How It Works

### 1. Helper Function: `getNextDates`
- **Purpose**: Calculates the next five future dates based on the recurring transaction's `start_date` and `frequency`.
- **Logic**:
  - Starts from `startDate` and advances based on the frequency (e.g., +1 day for 'Daily', +7 days for 'Weekly').
  - Only includes dates after today.
  - Stops if an `endDate` is provided and reached.
  - Returns an array of Date objects.

### 2. Main Function: `generateUpcomingTransactions`
- **Steps**:
  - **Fetch Recurring Transactions**: Queries the `recurring_transactions` table for the specified `userId`.
  - **Generate Future Dates**: Uses `getNextDates` to calculate the next five dates for each recurring transaction.
  - **Insert Records**: Checks for duplicates in `upcoming_transactions` and inserts new records with relevant details (e.g., amount, category, etc.).
  - **Error Handling**: Logs errors and continues processing if individual operations fail.

## Assumptions

- **Table Structure**:
  - `recurring_transactions`: Contains columns like `id`, `user_id`, `start_date`, `end_date`, `frequency`, `amount`, `type`, `category_id`, `category_name`, `account_type`, `description`.
  - `upcoming_transactions`: Similar columns plus `recurring_transaction_id`, `date`, `created_at`, and `updated_at`.
- **Supabase Setup**: The `createClient` utility is correctly configured to connect to your Supabase instance.

## Integration

To use this function in your application:

- **On App Load**: Call `generateUpcomingTransactions(userId)` when the user logs in or the app initializes:
  ```typescript
  await generateUpcomingTransactions('user-id-here');
  ```
- **After User Actions**: Trigger it after creating or editing a recurring transaction.
- **Scheduled Task**: Optionally, run it periodically (e.g., daily) via a cron job to keep upcoming transactions current.

## Testing

- **Setup Test Data**:
  - Insert a recurring transaction with `start_date` in the past, `frequency` as 'Weekly', and no `end_date`.
- **Run the Function**:
  - Execute `generateUpcomingTransactions('your-user-id')`.
  - Check console logs for confirmation messages.
- **Verify Results**:
  - Query `upcoming_transactions` in Supabase to ensure five future dates are added, starting from the next occurrence after today.

## Edge Cases Handled

- **No Recurring Transactions**: Logs a message and exits.
- **End Date**: Limits dates to before `end_date` if specified.
- **Duplicates**: Skips existing entries based on `recurring_transaction_id` and `date`.
- **Past Dates**: Only generates future dates relative to today.

This implementation provides a robust solution to generate five future upcoming transactions per recurring transaction, ready to be integrated into your Supabase-based application.
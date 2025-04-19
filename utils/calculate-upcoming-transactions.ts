import { RecurringTransaction, Transaction } from '@/app/types/transaction';
import { addDays, addMonths, addWeeks, addYears, format, isAfter, isBefore, startOfDay } from 'date-fns';

/**
 * Calculates upcoming transactions based on recurring transactions
 * @param recurringTransactions Array of recurring transactions
 * @param limit Number of upcoming transactions to generate per recurring transaction
 * @returns Array of upcoming transactions
 */
export function calculateUpcomingTransactions(
  recurringTransactions: RecurringTransaction[],
  limit: number = 2
): Transaction[] {
  const today = startOfDay(new Date());
  const upcomingTransactions: Transaction[] = [];

  recurringTransactions.forEach(recurringTransaction => {
    const startDate = new Date(recurringTransaction.start_date);
    const endDate = recurringTransaction.end_date ? new Date(recurringTransaction.end_date) : null;
    
    // Skip if the recurring transaction has ended
    if (endDate && isBefore(endDate, today)) {
      return;
    }

    // Generate upcoming transactions based on frequency
    let nextDate = getNextOccurrence(startDate, recurringTransaction.frequency, today);
    let count = 0;

    while (count < limit && nextDate) {
      // Skip if we've passed the end date
      if (endDate && isAfter(nextDate, endDate)) {
        break;
      }

      // Create the upcoming transaction
      const upcomingTransaction: Transaction = {
        name: recurringTransaction.name,
        amount: recurringTransaction.amount,
        date: nextDate,
        user_id: recurringTransaction.user_id,
        type: recurringTransaction.type,
        account_type: recurringTransaction.account_type,
        category_id: recurringTransaction.category_id,
        category_name: recurringTransaction.category_name,
        description: recurringTransaction.description,
        recurring_transaction_id: recurringTransaction.id,
        predicted: true // Mark as predicted/calculated
      };

      upcomingTransactions.push(upcomingTransaction);
      
      // Get the next occurrence
      nextDate = getNextOccurrence(nextDate, recurringTransaction.frequency);
      count++;
    }
  });

  // Sort by date (ascending)
  return upcomingTransactions.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });
}

/**
 * Gets the next occurrence of a recurring transaction based on frequency
 * @param baseDate The base date to calculate from
 * @param frequency The frequency type
 * @param minDate Optional minimum date (defaults to baseDate)
 * @returns The next occurrence date
 */
function getNextOccurrence(
  baseDate: Date,
  frequency: string,
  minDate: Date = baseDate
): Date {
  // Ensure we're working with Date objects
  baseDate = new Date(baseDate);
  minDate = new Date(minDate);
  
  // If minDate is after baseDate, we need to find the next occurrence after minDate
  let nextDate = new Date(baseDate);
  
  // Calculate the next date based on frequency
  switch (frequency) {
    case 'Daily':
      nextDate = addDays(baseDate, 1);
      break;
    case 'Weekly':
      nextDate = addWeeks(baseDate, 1);
      break;
    case 'Bi-Weekly':
      nextDate = addWeeks(baseDate, 2);
      break;
    case 'Tri-Weekly':
      nextDate = addWeeks(baseDate, 3);
      break;
    case 'Monthly':
      nextDate = addMonths(baseDate, 1);
      break;
    case 'Bi-Monthly':
      nextDate = addMonths(baseDate, 2);
      break;
    case 'Quarterly':
      nextDate = addMonths(baseDate, 3);
      break;
    case 'Semi-Annually':
      nextDate = addMonths(baseDate, 6);
      break;
    case 'Annually':
      nextDate = addYears(baseDate, 1);
      break;
    default:
      // For unsupported frequencies, just add a month
      nextDate = addMonths(baseDate, 1);
  }
  
  // If we're calculating from a minimum date that's after the base date,
  // we need to keep advancing until we find a date after minDate
  if (isBefore(nextDate, minDate)) {
    return getNextOccurrence(nextDate, frequency, minDate);
  }
  
  return nextDate;
}

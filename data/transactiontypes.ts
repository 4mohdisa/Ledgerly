export type TransactionType = 'Expense' | 'Income';

export const transactionTypes = [
  { value: 'Expense', label: 'Expense' },
  { value: 'Income', label: 'Income' },
];

// Additional export for backward compatibility
export const typeData = transactionTypes;
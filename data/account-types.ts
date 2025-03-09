export type AccountType = 'Cash' | 'Savings' | 'Checking';

export const accountTypes = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Savings', label: 'Savings' },
  { value: 'Checking', label: 'Checking' },
];

// Additional export for backward compatibility
export const accountTypesData = accountTypes;
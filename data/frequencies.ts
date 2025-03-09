// Define all possible frequency options
export type FrequencyType = 'Never' | 'Daily' | 'Weekly' | 'Bi-Weekly' | 'Tri-Weekly' | 'Monthly' | 'Bi-Monthly' | 'Quarterly' | 'Semi-Annually' | 'Annually' | 'Working Days Only' | 'First Day of Week' | 'Last Day of Week';

// Array of all frequencies for dropdown options
export const frequencies: { value: FrequencyType; label: string }[] = [
  { value: 'Never', label: 'One-time (not recurring)' },
  { value: 'Daily', label: 'Daily' },
  { value: 'Weekly', label: 'Weekly' },
  { value: 'Bi-Weekly', label: 'Bi-Weekly' },
  { value: 'Tri-Weekly', label: 'Tri-Weekly' },
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Bi-Monthly', label: 'Bi-Monthly' },
  { value: 'Quarterly', label: 'Quarterly' },
  { value: 'Semi-Annually', label: 'Semi-Annually' },
  { value: 'Annually', label: 'Annually' },
  { value: 'Working Days Only', label: 'Working Days Only' },
  { value: 'First Day of Week', label: 'First Day of Week' },
  { value: 'Last Day of Week', label: 'Last Day of Week' },
];

// Export the data for use in forms
export const recurringFrequencyData = frequencies;
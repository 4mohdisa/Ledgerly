/**
 * Utility functions for formatting values
 */

/**
 * Format a number as currency (USD by default)
 * @param value The number to format
 * @param locale The locale to use for formatting (default: 'en-US')
 * @param currency The currency code to use (default: 'USD')
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number, 
  locale: string = 'en-US', 
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a number with commas as thousands separators
 * @param value The number to format
 * @returns Formatted number string
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

/**
 * Format a percentage value
 * @param value The number to format as percentage (e.g., 0.25 for 25%)
 * @param decimalPlaces Number of decimal places to show (default: 1)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimalPlaces: number = 1): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(value);
}

/**
 * Format a date string to a readable format
 * @param dateString The date string to format (ISO format)
 * @param format The format to use (default: 'MMM d, yyyy')
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Utility functions for Arabic number formatting
 */

/**
 * Converts Western digits to Arabic digits - DISABLED
 * Now returns numbers as-is (Western numerals 0-9)
 */
export function toArabicDigits(str: string | number): string {
  // Return numbers as-is without conversion to Arabic digits
  return String(str);
}

/**
 * Formats string numbers to display as Western numerals
 * Handles both string and number inputs
 */
export function formatStringNumber(value: string | number | undefined): string {
  if (!value) return '—';
  return String(value);
}

/**
 * Enhanced Arabic number formatting with proper locale support
 */
export function formatArabicNumberEnhanced(value: number, options?: {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}): string {
  if (!Number.isFinite(value)) {
    return '—';
  }

  try {
    // Use Arabic locale for proper formatting
    const formatted = new Intl.NumberFormat('ar-IQ', {
      minimumFractionDigits: options?.minimumFractionDigits ?? 0,
      maximumFractionDigits: options?.maximumFractionDigits ?? 0,
    }).format(value);
    
    // Return formatted numbers as-is (Western numerals)
    return formatted;
  } catch {
    return value.toString();
  }
}

/**
 * Enhanced Arabic currency formatting
 */
export function formatArabicCurrencyEnhanced(amount: number, currency: string = 'IQD'): string {
  if (!Number.isFinite(amount)) {
    return '—';
  }

  try {
    const formatted = new Intl.NumberFormat('ar-IQ', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
    
    return formatted;
  } catch {
    return `${amount} ${currency}`;
  }
}

/**
 * Formats a number with Arabic digits and thousand separators
 */
export function formatArabicNumber(value: number, options?: {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}): string {
  if (!Number.isFinite(value)) {
    return '—';
  }

  try {
    const formatted = new Intl.NumberFormat('ar-IQ', {
      minimumFractionDigits: options?.minimumFractionDigits ?? 0,
      maximumFractionDigits: options?.maximumFractionDigits ?? 0,
    }).format(value);
    
    return formatted;
  } catch {
    return value.toString();
  }
}

/**
 * Formats currency with Arabic digits
 */
export function formatArabicCurrency(amount: number, currency: string = 'IQD'): string {
  if (!Number.isFinite(amount)) {
    return '—';
  }

  try {
    const formatted = new Intl.NumberFormat('ar-IQ', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
    
    return formatted;
  } catch {
    return `${amount} ${currency}`;
  }
}

/**
 * Formats date with Arabic digits
 */
export function formatArabicDate(date: string | Date, options?: {
  year?: 'numeric' | '2-digit';
  month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
  day?: 'numeric' | '2-digit';
}): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(dateObj.getTime())) return '';

  try {
    const formatted = new Intl.DateTimeFormat('ar-IQ', {
      year: options?.year ?? 'numeric',
      month: options?.month ?? '2-digit',
      day: options?.day ?? '2-digit',
    }).format(dateObj);
    
    return formatted;
  } catch {
    return dateObj.toISOString().slice(0, 10);
  }
}

/**
 * Formats date with Arabic digits for display
 */
export function formatArabicDateDisplay(date: string | Date): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(dateObj.getTime())) return '';

  try {
    const formatted = new Intl.DateTimeFormat('ar-IQ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(dateObj);
    
    return formatted;
  } catch {
    return dateObj.toISOString().slice(0, 10);
  }
}

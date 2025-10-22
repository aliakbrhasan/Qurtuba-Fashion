/**
 * Utility functions for Arabic number formatting
 */

/**
 * Converts Western digits to Arabic digits
 */
export function toArabicDigits(str: string | number): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  
  return String(str).replace(/[0-9]/g, (digit) => {
    return arabicDigits[parseInt(digit)];
  });
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
    
    // Convert to Arabic digits
    return toArabicDigits(formatted);
  } catch {
    return toArabicDigits(value.toString());
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
    
    return toArabicDigits(formatted);
  } catch {
    return `${toArabicDigits(amount)} ${currency}`;
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
    
    return toArabicDigits(formatted);
  } catch {
    return toArabicDigits(value.toString());
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
    
    return toArabicDigits(formatted);
  } catch {
    return `${toArabicDigits(amount)} ${currency}`;
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
    
    return toArabicDigits(formatted);
  } catch {
    return toArabicDigits(dateObj.toISOString().slice(0, 10));
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
    
    return toArabicDigits(formatted);
  } catch {
    return toArabicDigits(dateObj.toISOString().slice(0, 10));
  }
}

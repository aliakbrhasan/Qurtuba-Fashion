/**
 * Utility helpers to standardize digits across the app
 * Always output Western numerals (0-9) regardless of input locale.
 */

/**
 * Normalize any Arabic-Indic or Eastern Arabic-Indic digits to Western digits 0-9
 */
export function toWesternDigits(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return '';
  const s = String(input);
  const map: Record<string, string> = {
    // Arabic-Indic (U+0660–U+0669)
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    // Eastern Arabic-Indic/Persian (U+06F0–U+06F9)
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
    // Arabic punctuation variants to Latin
    '٫': '.', // Arabic decimal separator
    '٬': ',', // Arabic thousands separator
    '،': ',', // Arabic comma
  };
  return s.replace(/[٠-٩۰-۹٫٬،]/g, (ch) => map[ch] ?? ch);
}

/**
 * Legacy API: keep signature, but standardize to Western digits
 */
export function toArabicDigits(str: string | number): string {
  return toWesternDigits(str);
}

/**
 * Formats string numbers to display as Western numerals
 * Handles both string and number inputs
 */
export function formatStringNumber(value: string | number | undefined): string {
  if (!value && value !== 0) return '';
  return toWesternDigits(value as any);
}

/**
 * Enhanced number formatting (Western digits)
 */
export function formatArabicNumberEnhanced(value: number, options?: {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}): string {
  if (!Number.isFinite(value)) {
    return '';
  }

  try {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: options?.minimumFractionDigits ?? 0,
      maximumFractionDigits: options?.maximumFractionDigits ?? 0,
    }).format(value);
    return toWesternDigits(formatted);
  } catch {
    return toWesternDigits(value.toString());
  }
}

/**
 * Enhanced currency formatting (Western digits)
 */
export function formatArabicCurrencyEnhanced(amount: number, currency: string = 'IQD'): string {
  if (!Number.isFinite(amount)) {
    return '';
  }

  try {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
    return toWesternDigits(formatted);
  } catch {
    return toWesternDigits(`${amount} ${currency}`);
  }
}

/**
 * Formats a number with thousand separators (Western digits)
 */
export function formatArabicNumber(value: number, options?: {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}): string {
  if (!Number.isFinite(value)) {
    return '';
  }

  try {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: options?.minimumFractionDigits ?? 0,
      maximumFractionDigits: options?.maximumFractionDigits ?? 0,
    }).format(value);
    return toWesternDigits(formatted);
  } catch {
    return toWesternDigits(value.toString());
  }
}

/**
 * Formats currency (Western digits)
 */
export function formatArabicCurrency(amount: number, currency: string = 'IQD'): string {
  if (!Number.isFinite(amount)) {
    return '';
  }

  try {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
    return toWesternDigits(formatted);
  } catch {
    return toWesternDigits(`${amount} ${currency}`);
  }
}

/**
 * Formats date (Western digits)
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
    const formatted = new Intl.DateTimeFormat('en-GB', {
      year: options?.year ?? 'numeric',
      month: options?.month ?? '2-digit',
      day: options?.day ?? '2-digit',
    }).format(dateObj);
    return toWesternDigits(formatted);
  } catch {
    return toWesternDigits(dateObj.toISOString().slice(0, 10));
  }
}

/**
 * Formats date for display (Western digits)
 */
export function formatArabicDateDisplay(date: string | Date): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(dateObj.getTime())) return '';

  try {
    const formatted = new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(dateObj);
    return toWesternDigits(formatted);
  } catch {
    return toWesternDigits(dateObj.toISOString().slice(0, 10));
  }
}


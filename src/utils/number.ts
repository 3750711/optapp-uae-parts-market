/**
 * Utility functions for handling number input across different locales and devices
 * Specifically designed to handle Android/Telegram WebView decimal input issues
 */

/**
 * Normalizes decimal input by accepting both comma and dot as decimal separators
 * Handles null/undefined/empty values gracefully
 */
export function normalizeDecimal(input: string | number | null | undefined): number {
  if (input == null || input === '') return 0;
  
  const str = String(input).trim();
  if (!str) return 0;
  
  // Replace comma with dot and remove any whitespace
  const normalized = str.replace(',', '.').replace(/\s+/g, '');
  
  // Parse the number
  const parsed = Number(normalized);
  
  // Return 0 for invalid numbers, otherwise return the parsed value
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Formats a number for display with proper decimal separator based on locale
 */
export function formatPrice(value: number, locale: string = 'ru-RU'): string {
  if (!Number.isFinite(value)) return '0';
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Parses number input with fallbacks for mobile keyboards
 * More robust than parseFloat for user input
 */
export function parseNumberInput(input: string | number, fallback: number = 0): number {
  if (typeof input === 'number') return Number.isFinite(input) ? input : fallback;
  
  const normalized = normalizeDecimal(input);
  return normalized === 0 && input && input.toString().trim() !== '0' ? fallback : normalized;
}

/**
 * Validates if a string represents a valid number (accepting comma or dot)
 */
export function isValidNumber(input: string): boolean {
  if (!input || !input.trim()) return false;
  
  const normalized = input.trim().replace(',', '.').replace(/\s+/g, '');
  const parsed = Number(normalized);
  
  return Number.isFinite(parsed);
}

/**
 * Safely converts any input to a positive number (for prices, quantities, etc.)
 */
export function toPositiveNumber(input: string | number | null | undefined): number {
  const normalized = normalizeDecimal(input);
  return Math.max(0, normalized);
}
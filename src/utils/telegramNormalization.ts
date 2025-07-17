/**
 * Utility functions for normalizing and validating Telegram usernames
 */

/**
 * Normalizes a Telegram username by adding @ prefix if missing
 * @param username - The Telegram username to normalize
 * @returns Normalized username with @ prefix
 */
export function normalizeTelegramUsername(username: string | null | undefined): string {
  if (!username) return '';
  
  // Trim whitespace
  const trimmed = username.trim();
  if (!trimmed) return '';
  
  // Remove @ from the beginning if present, then add it back to ensure consistency
  const withoutAt = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
  
  // Validate username format (basic validation)
  if (!isValidTelegramUsername(withoutAt)) {
    return trimmed; // Return original if invalid format
  }
  
  return `@${withoutAt}`;
}

/**
 * Validates if a username follows Telegram username rules
 * @param username - Username without @ prefix
 * @returns true if valid, false otherwise
 */
export function isValidTelegramUsername(username: string): boolean {
  if (!username) return false;
  
  // Remove @ if present for validation
  const cleanUsername = username.startsWith('@') ? username.slice(1) : username;
  
  // Telegram username rules:
  // - 5-32 characters long
  // - Can contain letters, numbers, and underscores
  // - Must start with a letter
  // - Cannot end with underscore
  // - Cannot have two consecutive underscores
  const telegramUsernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/;
  
  if (!telegramUsernameRegex.test(cleanUsername)) {
    return false;
  }
  
  // Check for consecutive underscores
  if (cleanUsername.includes('__')) {
    return false;
  }
  
  // Check if ends with underscore
  if (cleanUsername.endsWith('_')) {
    return false;
  }
  
  return true;
}

/**
 * Validates and normalizes Telegram username for form input
 * @param username - Input username
 * @returns Object with normalized username and validation result
 */
export function validateAndNormalizeTelegramUsername(username: string): {
  normalized: string;
  isValid: boolean;
  error?: string;
} {
  if (!username || !username.trim()) {
    return {
      normalized: '',
      isValid: true, // Empty is valid (optional field)
    };
  }
  
  const normalized = normalizeTelegramUsername(username);
  const cleanUsername = normalized.slice(1); // Remove @ for validation
  
  if (!isValidTelegramUsername(cleanUsername)) {
    return {
      normalized,
      isValid: false,
      error: 'Неверный формат Telegram username. Должен содержать 5-32 символа, начинаться с буквы, содержать только буквы, цифры и подчеркивания.',
    };
  }
  
  return {
    normalized,
    isValid: true,
  };
}
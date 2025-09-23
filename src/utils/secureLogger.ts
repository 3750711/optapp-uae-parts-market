/**
 * Secure logging utility that filters sensitive information
 * Used to prevent leaking passwords, tokens, and other secrets in logs
 */

import { SENSITIVE_FIELDS } from '@/config/security';

// Sensitive patterns to redact
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /key/i,
  /authorization/i,
  /cookie/i,
  /session/i,
  /private/i,
  /credential/i,
  /api[_-]?key/i,
  /access[_-]?token/i,
  /refresh[_-]?token/i,
  /recovery[_-]?token/i,
  /bearer/i,
];

const REDACTED_TEXT = '[REDACTED]';
const REDACTED_OBJECT = { '[REDACTED]': true };

/**
 * Checks if a string contains sensitive information
 */
function containsSensitiveInfo(text: string): boolean {
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Redacts sensitive values from a string
 */
function redactSensitiveString(text: string): string {
  if (containsSensitiveInfo(text)) {
    // Replace potential tokens/secrets with redacted text
    return text
      .replace(/(["\'])[a-zA-Z0-9+/=_-]{20,}(["\'])/g, '$1[REDACTED_TOKEN]$2')
      .replace(/:\s*["\'][^"\']{20,}["\'](?=[\s,}])/g, ': "[REDACTED_VALUE]"')
      .replace(/=\s*[a-zA-Z0-9+/=_-]{20,}/g, '=[REDACTED_VALUE]');
  }
  return text;
}

/**
 * Recursively sanitizes an object, redacting sensitive fields
 */
function sanitizeObject(obj: any, depth = 0): any {
  // Prevent infinite recursion
  if (depth > 5) return REDACTED_OBJECT;

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return redactSensitiveString(obj);
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }

  if (obj instanceof Date) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      
      // Check if key contains sensitive field names
      const isSensitiveKey = SENSITIVE_FIELDS.some(field => 
        lowerKey.includes(field.toLowerCase())
      ) || containsSensitiveInfo(key);

      if (isSensitiveKey) {
        sanitized[key] = REDACTED_TEXT;
      } else {
        sanitized[key] = sanitizeObject(value, depth + 1);
      }
    }
    
    return sanitized;
  }

  return obj;
}

/**
 * Sanitizes arguments for safe logging
 */
function sanitizeArgs(...args: any[]): any[] {
  return args.map(arg => {
    if (typeof arg === 'string') {
      return redactSensitiveString(arg);
    }
    return sanitizeObject(arg);
  });
}

/**
 * Safe console logging functions
 */
export const secureConsole = {
  log: (...args: any[]) => {
    const sanitized = sanitizeArgs(...args);
    console.log(...sanitized);
  },
  
  info: (...args: any[]) => {
    const sanitized = sanitizeArgs(...args);
    console.info(...sanitized);
  },
  
  warn: (...args: any[]) => {
    const sanitized = sanitizeArgs(...args);
    console.warn(...sanitized);
  },
  
  error: (...args: any[]) => {
    const sanitized = sanitizeArgs(...args);
    console.error(...sanitized);
  },
  
  debug: (...args: any[]) => {
    const sanitized = sanitizeArgs(...args);
    console.debug(...sanitized);
  }
};

/**
 * Specialized secure logging functions
 */
export const secureAuth = {
  /**
   * Safe auth operation logging
   */
  log: (message: string, data?: any) => {
    const sanitizedData = data ? sanitizeObject(data) : undefined;
    if (sanitizedData) {
      secureConsole.log(`🔐 [AUTH] ${message}`, sanitizedData);
    } else {
      secureConsole.log(`🔐 [AUTH] ${message}`);
    }
  },
  
  /**
   * Safe auth error logging
   */
  error: (message: string, error?: any) => {
    const sanitizedError = error ? sanitizeObject(error) : undefined;
    if (sanitizedError) {
      secureConsole.error(`❌ [AUTH] ${message}`, sanitizedError);
    } else {
      secureConsole.error(`❌ [AUTH] ${message}`);
    }
  },
  
  /**
   * Safe auth warning logging
   */
  warn: (message: string, data?: any) => {
    const sanitizedData = data ? sanitizeObject(data) : undefined;
    if (sanitizedData) {
      secureConsole.warn(`⚠️ [AUTH] ${message}`, sanitizedData);
    } else {
      secureConsole.warn(`⚠️ [AUTH] ${message}`);
    }
  }
};

/**
 * Recovery operation specific logging
 */
export const secureRecovery = {
  log: (message: string) => {
    secureConsole.log(`🔒 [RECOVERY] ${message}`);
  },
  
  error: (message: string, error?: any) => {
    const sanitizedError = error ? sanitizeObject(error) : undefined;
    if (sanitizedError) {
      secureConsole.error(`❌ [RECOVERY] ${message}`, sanitizedError);
    } else {
      secureConsole.error(`❌ [RECOVERY] ${message}`);
    }
  }
};

// Export utility functions for external use
export { sanitizeObject, sanitizeArgs, containsSensitiveInfo };
/**
 * Security configuration and constants
 * This file centralizes security-related settings
 */

// Rate limiting constants
export const RATE_LIMITS = {
  // Authentication attempts
  LOGIN_ATTEMPTS_PER_HOUR: 5,
  PASSWORD_RESET_PER_HOUR: 3,
  
  // API operations
  PRODUCT_CREATION_PER_HOUR: 20,
  ORDER_CREATION_PER_HOUR: 10,
  PRICE_OFFER_PER_HOUR: 15,
  
  // Messaging
  TELEGRAM_MESSAGES_PER_HOUR: 50,
  
  // File uploads
  IMAGE_UPLOADS_PER_HOUR: 100,
  VIDEO_UPLOADS_PER_HOUR: 10,
} as const;

// Content Security Policy configuration
// WARNING: 'unsafe-eval' is required for Telegram login widget functionality
// This is a security compromise but necessary for the Telegram widget's internal eval() calls
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'img-src': ["'self'", "https://res.cloudinary.com", "https://cdn.gpteng.co", "https://c.clarity.ms", "data:"],
  'connect-src': ["'self'", "https://*.supabase.co", "wss://*.supabase.co", "https://cdn.gpteng.co", "https://*.clarity.ms", "https://telegram.org"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.gpteng.co", "https://www.clarity.ms", "https://scripts.clarity.ms", "https://telegram.org"],
  'script-src-elem': ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.gpteng.co", "https://www.clarity.ms", "https://scripts.clarity.ms", "https://telegram.org"],
  'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  'font-src': ["'self'", "data:", "https://fonts.gstatic.com"],
  'frame-src': ["https://oauth.telegram.org"],
  'frame-ancestors': ["'none'"],
} as const;

// Security headers configuration
export const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
} as const;

// File upload security
export const FILE_UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_PER_UPLOAD: 10,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/quicktime'],
} as const;

// Input validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PHONE: /^\+?[\d\s\-\(\)]{10,}$/,
  TELEGRAM: /^[a-zA-Z0-9_]{5,32}$/,
  OPT_ID: /^[A-Z0-9]{4,20}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
} as const;

// Error messages (sanitized for public display)
export const SECURITY_ERRORS = {
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.',
  INVALID_FILE_TYPE: 'Invalid file type. Please upload a supported format.',
  FILE_TOO_LARGE: 'File size exceeds the maximum allowed limit.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  INVALID_INPUT: 'Invalid input provided.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
} as const;

// Sensitive field names for logging protection
export const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'key',
  'authorization',
  'cookie',
  'session',
  'email',
  'phone',
  'telegram',
  'api_key',
  'access_token',
  'refresh_token',
  'private_key',
  'certificate',
] as const;

// Environment validation
export function validateEnvironment() {
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_PUBLISHABLE_KEY',
  ];
  
  const missing = requiredEnvVars.filter(envVar => !import.meta.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Security utilities
export const SecurityUtils = {
  /**
   * Sanitizes a string for safe display
   */
  sanitizeString: (input: string): string => {
    return input.replace(/[<>&"']/g, (char) => {
      switch (char) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '"': return '&quot;';
        case "'": return '&#x27;';
        default: return char;
      }
    });
  },

  /**
   * Validates if a value contains sensitive information
   */
  containsSensitiveData: (key: string, value: any): boolean => {
    if (typeof value !== 'string') return false;
    
    const lowerKey = key.toLowerCase();
    return SENSITIVE_FIELDS.some(field => lowerKey.includes(field));
  },

  /**
   * Generates a secure random string
   */
  generateSecureId: (): string => {
    return crypto.randomUUID();
  },

  /**
   * Validates input against common injection patterns
   */
  validateInput: (input: string): boolean => {
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:\s*text\/html/gi,
    ];
    
    return !dangerousPatterns.some(pattern => pattern.test(input));
  },
} as const;
/**
 * Centralized logging utility with production safety
 * Prevents sensitive data exposure and controls log verbosity
 */

interface LogData {
  [key: string]: any;
}

interface SensitiveFields {
  [key: string]: boolean;
}

const SENSITIVE_FIELDS: SensitiveFields = {
  password: true,
  token: true,
  secret: true,
  key: true,
  authorization: true,
  cookie: true,
  session: true,
  email: true,
  phone: true,
  telegram: true,
  api_key: true,
  access_token: true,
  refresh_token: true,
};

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

/**
 * Masks sensitive data in objects for safe logging
 */
function maskSensitiveData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(maskSensitiveData);
  }

  const masked: any = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = Object.keys(SENSITIVE_FIELDS).some(field => 
      lowerKey.includes(field)
    );
    
    if (isSensitive) {
      masked[key] = '***REDACTED***';
    } else if (typeof value === 'object') {
      masked[key] = maskSensitiveData(value);
    } else {
      masked[key] = value;
    }
  }
  
  return masked;
}

/**
 * Safe console.log replacement
 */
export const logger = {
  log: (message: string, data?: LogData) => {
    if (isDevelopment) {
      if (data) {
        console.log(`🔍 ${message}`, maskSensitiveData(data));
      } else {
        console.log(`🔍 ${message}`);
      }
    }
  },

  info: (message: string, data?: LogData) => {
    if (data) {
      console.info(`ℹ️ ${message}`, maskSensitiveData(data));
    } else {
      console.info(`ℹ️ ${message}`);
    }
  },

  warn: (message: string, data?: LogData) => {
    if (data) {
      console.warn(`⚠️ ${message}`, maskSensitiveData(data));
    } else {
      console.warn(`⚠️ ${message}`);
    }
  },

  error: (message: string, error?: any, data?: LogData) => {
    const errorInfo: any = {
      message: error?.message || error,
      stack: isDevelopment ? error?.stack : undefined,
    };
    
    if (data) {
      errorInfo.data = maskSensitiveData(data);
    }

    console.error(`❌ ${message}`, errorInfo);
  },

  debug: (message: string, data?: LogData) => {
    if (isDevelopment) {
      if (data) {
        console.debug(`🐛 ${message}`, maskSensitiveData(data));
      } else {
        console.debug(`🐛 ${message}`);
      }
    }
  },

  security: (message: string, data?: LogData) => {
    // Security events should always be logged, even in production
    const securityEvent = {
      timestamp: new Date().toISOString(),
      event: message,
      data: data ? maskSensitiveData(data) : undefined,
      environment: isProduction ? 'production' : 'development',
    };
    
    console.warn(`🔒 SECURITY: ${message}`, securityEvent);
  },
};

// Export for backward compatibility (to be removed gradually)
export const devLog = logger.log;
export const devError = logger.error;
export const devWarn = logger.warn;
export const prodError = logger.error;
export const throttledDevLog = logger.log;
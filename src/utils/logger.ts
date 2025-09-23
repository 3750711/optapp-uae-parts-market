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

  error: (message: string | Error, error?: any, data?: LogData) => {
    let errorMessage: string;
    let errorObject: any;
    
    if (message instanceof Error) {
      errorMessage = message.message;
      errorObject = message;
    } else {
      errorMessage = message;
      errorObject = error;
    }
    
    const errorInfo: any = {
      message: errorObject?.message || errorObject,
      stack: isDevelopment ? errorObject?.stack : undefined,
    };
    
    if (data) {
      errorInfo.data = maskSensitiveData(data);
    }

    console.error(`❌ ${errorMessage}`, errorInfo);
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

// Backward compatibility functions to match existing usage patterns
const compatLog = (message: string, data?: any, additionalInfo?: any) => {
  if (isDevelopment) {
    if (additionalInfo !== undefined) {
      // Handle 3-argument case
      console.log(`🔍 ${message}`, data, additionalInfo);
    } else if (data && typeof data === 'object') {
      console.log(`🔍 ${message}`, maskSensitiveData(data));
    } else if (data !== undefined) {
      console.log(`🔍 ${message}`, data);
    } else {
      console.log(`🔍 ${message}`);
    }
  }
};

const compatError = (errorOrMessage: string | Error, data?: any, additionalData?: any) => {
  let message: string;
  let errorData: any;
  
  if (errorOrMessage instanceof Error) {
    message = errorOrMessage.message;
    errorData = errorOrMessage;
  } else {
    message = errorOrMessage;
    errorData = data;
  }
  
  const errorInfo: any = {
    message: errorData?.message || errorData,
    stack: isDevelopment ? errorData?.stack : undefined,
  };
  
  if (additionalData) {
    errorInfo.additionalData = maskSensitiveData(additionalData);
  } else if (data && typeof data === 'object' && !(data instanceof Error)) {
    errorInfo.data = maskSensitiveData(data);
  }

  console.error(`❌ ${message}`, errorInfo);
};

// Export for backward compatibility (to be removed gradually)
export const devLog = compatLog;
export const devError = compatError;
export const devWarn = logger.warn;
export const prodError = compatError;
export const throttledDevLog = compatLog;
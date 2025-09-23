import { secureConsole, secureAuth, sanitizeArgs } from './secureLogger';

const isDev = process.env.NODE_ENV === 'development';

// Individual logger functions with security filtering
const log = (...args: any[]) => isDev && secureConsole.log(...args);
const error = (...args: any[]) => isDev && secureConsole.error(...args);
const warn = (...args: any[]) => isDev && secureConsole.warn(...args);
const debug = (...args: any[]) => isDev && secureConsole.debug(...args);

// Existing methods used in the project (now secure)
const devLog = (...args: any[]) => isDev && secureConsole.log(...args);
const devError = (...args: any[]) => isDev && secureConsole.error(...args);
const prodError = (...args: any[]) => secureConsole.error(...args);

// Throttled logging with simple debounce (now secure)
let throttleTimer: NodeJS.Timeout | null = null;
const throttledDevLog = (...args: any[]) => {
  if (!isDev) return;
  if (throttleTimer) return;
  const sanitized = sanitizeArgs(...args);
  console.log(...sanitized);
  throttleTimer = setTimeout(() => { throttleTimer = null; }, 100);
};

// Security method (already secure but enhanced)
const security = (...args: any[]) => {
  const sanitized = sanitizeArgs(...args);
  console.log('[SECURITY]', ...sanitized);
};

// New secure auth logging methods
const authLog = (message: string, data?: any) => secureAuth.log(message, data);
const authError = (message: string, error?: any) => secureAuth.error(message, error);
const authWarn = (message: string, data?: any) => secureAuth.warn(message, data);

// Secure general purpose logging
const secureLog = (...args: any[]) => secureConsole.log(...args);
const secureError = (...args: any[]) => secureConsole.error(...args);
const secureWarn = (...args: any[]) => secureConsole.warn(...args);

// Export logger object
export const logger = {
  log,
  error,
  warn,
  debug,
  devLog,
  devError,
  prodError,
  throttledDevLog,
  security,
  // New secure methods
  authLog,
  authError,
  authWarn,
  secureLog,
  secureError,
  secureWarn
};

// Export individual methods for backward compatibility
export { 
  log, error, warn, debug, devLog, devError, prodError, throttledDevLog, security,
  // New secure methods
  authLog, authError, authWarn, secureLog, secureError, secureWarn
};

const isDev = process.env.NODE_ENV === 'development';

// Individual logger functions
const log = (...args: any[]) => isDev && console.log(...args);
const error = (...args: any[]) => isDev && console.error(...args);
const warn = (...args: any[]) => isDev && console.warn(...args);
const debug = (...args: any[]) => isDev && console.debug(...args);

// Existing methods used in the project
const devLog = (...args: any[]) => isDev && console.log(...args);
const devError = (...args: any[]) => isDev && console.error(...args);
const prodError = (...args: any[]) => console.error(...args);

// Throttled logging with simple debounce
let throttleTimer: NodeJS.Timeout | null = null;
const throttledDevLog = (...args: any[]) => {
  if (!isDev) return;
  if (throttleTimer) return;
  console.log(...args);
  throttleTimer = setTimeout(() => { throttleTimer = null; }, 100);
};

// Security method
const security = (...args: any[]) => console.log('[SECURITY]', ...args);

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
  security
};

// Export individual methods for backward compatibility
export { log, error, warn, debug, devLog, devError, prodError, throttledDevLog, security };

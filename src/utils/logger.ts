const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: any[]) => isDev && console.log(...args),
  error: (...args: any[]) => isDev && console.error(...args),
  warn: (...args: any[]) => isDev && console.warn(...args),
  debug: (...args: any[]) => isDev && console.debug(...args),
  
  // Existing methods used in the project
  devLog: (...args: any[]) => isDev && console.log(...args),
  devError: (...args: any[]) => isDev && console.error(...args),
  prodError: (...args: any[]) => console.error(...args),
  throttledDevLog: (...args: any[]) => isDev && console.log(...args),
  
  // Security method
  security: (...args: any[]) => console.log('[SECURITY]', ...args)
};

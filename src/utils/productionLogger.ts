// Production-safe logging utility
const IS_DEV = import.meta.env.DEV;

export const logger = {
  log: IS_DEV ? console.log : () => {},
  error: IS_DEV ? console.error : () => {},
  warn: IS_DEV ? console.warn : () => {},
  debug: IS_DEV ? console.debug : () => {},
};
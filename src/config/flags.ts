/**
 * Feature flags for enabling/disabling functionality
 */
export const FLAGS = {
  /**
   * Enable detailed debug logging (controlled by runtime config)
   */
  DEBUG_AUTH: (() => {
    if (typeof window !== 'undefined') {
      return !!(window as any).__PB_RUNTIME__?.DEBUG_AUTH;
    }
    return false;
  })(),
};

/**
 * Development helper to log flag states
 */
if (FLAGS.DEBUG_AUTH) {
  console.debug('[FLAGS]', {
    DEBUG_AUTH: FLAGS.DEBUG_AUTH
  });
}
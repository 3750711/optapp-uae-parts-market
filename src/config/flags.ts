/**
 * Feature flags for enabling/disabling functionality
 */
export const FLAGS = {
  /**
   * Enable/disable Realtime WebSocket connections
   * Can be controlled via runtime config or environment variable
   */
  REALTIME_ENABLED: (() => {
    // First check runtime config
    if (typeof window !== 'undefined') {
      const runtime = (window as any).__PB_RUNTIME__;
      if (runtime && typeof runtime.REALTIME_ENABLED === 'boolean') {
        console.debug('[FLAGS] REALTIME_ENABLED from runtime config:', runtime.REALTIME_ENABLED);
        return runtime.REALTIME_ENABLED;
      }
    }
    
    // Fallback to environment variable (default: false for safety)
    const fallback = process.env.NODE_ENV !== 'test';
    console.debug('[FLAGS] REALTIME_ENABLED fallback (no runtime config):', fallback);
    return fallback;
  })(),

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
    REALTIME_ENABLED: FLAGS.REALTIME_ENABLED,
    DEBUG_AUTH: FLAGS.DEBUG_AUTH
  });
}
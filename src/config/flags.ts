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

  /**
   * Enhanced PWA protection features
   */
  ENHANCED_PWA_PROTECTION: (() => {
    if (typeof window !== 'undefined') {
      return !!(window as any).__PB_RUNTIME__?.ENHANCED_PWA_PROTECTION;
    }
    return false;
  })(),

  /**
   * Session backup and restore functionality
   */
  SESSION_BACKUP_ENABLED: (() => {
    if (typeof window !== 'undefined') {
      return !!(window as any).__PB_RUNTIME__?.SESSION_BACKUP_ENABLED;
    }
    return false;
  })(),

  /**
   * Session monitoring for PWA apps
   */
  SESSION_MONITORING: (() => {
    if (typeof window !== 'undefined') {
      return !!(window as any).__PB_RUNTIME__?.SESSION_MONITORING;
    }
    return false;
  })(),
};

/**
 * Development helper to log flag states
 */
if (FLAGS.DEBUG_AUTH) {
  console.debug('[FLAGS]', {
    DEBUG_AUTH: FLAGS.DEBUG_AUTH,
    ENHANCED_PWA_PROTECTION: FLAGS.ENHANCED_PWA_PROTECTION,
    SESSION_BACKUP_ENABLED: FLAGS.SESSION_BACKUP_ENABLED,
    SESSION_MONITORING: FLAGS.SESSION_MONITORING
  });
}
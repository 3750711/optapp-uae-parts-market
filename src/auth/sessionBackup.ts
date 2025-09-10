import type { Session } from '@supabase/supabase-js';

interface SessionBackup {
  session: Session;
  timestamp: number;
  userAgent: string;
  expiresAt: number;
}

/**
 * SessionBackupManager - Secure backup and restore of authentication sessions for PWA
 * Prevents session loss during app backgrounding/foregrounding cycles
 */
class SessionBackupManager {
  private static readonly BACKUP_KEY = 'pb_session_backup';
  private static readonly MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
  
  /**
   * Backup current session to localStorage with security checks
   */
  backupSession(session: Session): boolean {
    try {
      if (!session?.access_token || !session?.expires_at) {
        return false;
      }
      
      // Don't backup expired sessions
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at <= now) {
        return false;
      }
      
      const backup: SessionBackup = {
        session,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        expiresAt: session.expires_at * 1000 // Convert to milliseconds
      };
      
      localStorage.setItem(SessionBackupManager.BACKUP_KEY, JSON.stringify(backup));
      return true;
    } catch (error) {
      console.warn('[SessionBackup] Failed to backup session:', error);
      return false;
    }
  }
  
  /**
   * Restore session from backup with security validation
   */
  restoreSession(): Session | null {
    try {
      const backupStr = localStorage.getItem(SessionBackupManager.BACKUP_KEY);
      if (!backupStr) return null;
      
      const backup: SessionBackup = JSON.parse(backupStr);
      
      // Security: Check user agent to prevent cross-device attacks
      if (backup.userAgent !== navigator.userAgent) {
        this.clearBackup();
        return null;
      }
      
      // Check age
      const age = Date.now() - backup.timestamp;
      if (age > SessionBackupManager.MAX_AGE_MS) {
        this.clearBackup();
        return null;
      }
      
      // Check expiration
      if (Date.now() > backup.expiresAt) {
        this.clearBackup();
        return null;
      }
      
      return backup.session;
    } catch (error) {
      console.warn('[SessionBackup] Failed to restore session:', error);
      this.clearBackup();
      return null;
    }
  }
  
  /**
   * Check if we have a valid backup available
   */
  hasValidBackup(): boolean {
    const restored = this.restoreSession();
    return !!restored;
  }
  
  /**
   * Clear session backup
   */
  clearBackup(): void {
    try {
      localStorage.removeItem(SessionBackupManager.BACKUP_KEY);
    } catch (error) {
      console.warn('[SessionBackup] Failed to clear backup:', error);
    }
  }
  
  /**
   * Get backup info for debugging
   */
  getBackupInfo(): { hasBackup: boolean; age?: number; expiresIn?: number } {
    try {
      const backupStr = localStorage.getItem(SessionBackupManager.BACKUP_KEY);
      if (!backupStr) return { hasBackup: false };
      
      const backup: SessionBackup = JSON.parse(backupStr);
      const now = Date.now();
      
      return {
        hasBackup: true,
        age: now - backup.timestamp,
        expiresIn: backup.expiresAt - now
      };
    } catch {
      return { hasBackup: false };
    }
  }
}

export const sessionBackupManager = new SessionBackupManager();
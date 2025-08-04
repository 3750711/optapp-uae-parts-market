// Redirect protection utility to prevent infinite loops
const REDIRECT_LIMIT = 2;
const REDIRECT_WINDOW = 5000; // 5 seconds

interface RedirectAttempt {
  timestamp: number;
  from: string;
  to: string;
}

class RedirectProtection {
  private attempts: RedirectAttempt[] = [];

  canRedirect(from: string, to: string): boolean {
    const now = Date.now();
    
    // Clean old attempts outside the time window
    this.attempts = this.attempts.filter(
      attempt => now - attempt.timestamp < REDIRECT_WINDOW
    );

    // Check for same redirect as the last one (prevent immediate loops)
    const lastAttempt = this.attempts[this.attempts.length - 1];
    if (lastAttempt && lastAttempt.from === from && lastAttempt.to === to) {
      console.error('🚨 Same redirect detected! Blocking duplicate redirect', {
        from,
        to,
        lastAttempt
      });
      return false;
    }

    // Count recent attempts
    const recentAttempts = this.attempts.length;
    
    // Check if we've exceeded the limit
    if (recentAttempts >= REDIRECT_LIMIT) {
      console.error('🚨 Redirect loop detected! Blocking further redirects', {
        attempts: this.attempts,
        from,
        to
      });
      return false;
    }

    // Log the attempt
    this.attempts.push({ timestamp: now, from, to });
    console.log('✅ Redirect allowed', { from, to, attempt: recentAttempts + 1 });
    
    return true;
  }

  reset(): void {
    this.attempts = [];
    console.log('🔄 Redirect protection reset');
  }

  getAttempts(): RedirectAttempt[] {
    return [...this.attempts];
  }
}

export const redirectProtection = new RedirectProtection();
/**
 * Мониторинг здоровья api.partsbay.ae прокси
 */

type HealthStatus = 'unknown' | 'healthy' | 'failing';

class ProxyHealthMonitor {
  private health: HealthStatus = 'unknown';
  private lastCheck = 0;
  private readonly CHECK_INTERVAL = 30000; // 30 seconds
  
  async getHealth(): Promise<HealthStatus> {
    const now = Date.now();
    if (now - this.lastCheck > this.CHECK_INTERVAL || this.health === 'unknown') {
      await this.checkHealth();
    }
    return this.health;
  }
  
  private async checkHealth(): Promise<void> {
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch('https://api.partsbay.ae/rest/v1/', {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'cors'
      });
      
      this.health = response.ok ? 'healthy' : 'failing';
      this.lastCheck = Date.now();
      
      if (this.health === 'failing') {
        console.warn(`🚨 Proxy health check failed: ${response.status}`);
      } else {
        console.log('✅ Proxy health check passed');
      }
    } catch (error) {
      this.health = 'failing';
      this.lastCheck = Date.now();
      console.warn('🚨 Proxy health check error:', error);
    }
  }
  
  getStatus() {
    return {
      health: this.health,
      lastCheck: new Date(this.lastCheck).toISOString(),
      nextCheck: new Date(this.lastCheck + this.CHECK_INTERVAL).toISOString()
    };
  }
}

export const proxyHealthMonitor = new ProxyHealthMonitor();
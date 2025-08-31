import { Page } from '@playwright/test';

export interface RequestLog {
  url: string;
  method: string;
  timestamp: number;
  status?: number;
  duration?: number;
}

export class NetworkMonitor {
  private requests: RequestLog[] = [];
  private page: Page;
  
  constructor(page: Page) {
    this.page = page;
    this.setupListeners();
  }
  
  private setupListeners() {
    this.page.on('request', request => {
      this.requests.push({
        url: request.url(),
        method: request.method(),
        timestamp: Date.now(),
      });
    });
    
    this.page.on('response', response => {
      const request = this.requests.find(r => 
        r.url === response.url() && !r.status
      );
      if (request) {
        request.status = response.status();
        request.duration = Date.now() - request.timestamp;
      }
    });
  }
  
  countRequests(pattern: RegExp, timeWindow?: number): number {
    const now = Date.now();
    return this.requests.filter(req => {
      const matchesPattern = pattern.test(req.url);
      const inTimeWindow = !timeWindow || (now - req.timestamp) <= timeWindow;
      return matchesPattern && inTimeWindow;
    }).length;
  }
  
  getRequestsByPattern(pattern: RegExp): RequestLog[] {
    return this.requests.filter(req => pattern.test(req.url));
  }
  
  clear() {
    this.requests = [];
  }
  
  // Готовые паттерны для частых проверок
  static patterns = {
    PROFILES: /\/rest\/v1\/profiles/,
    VERIFY_ADMIN: /verifyAdminAccess/,
    AUTH: /\/auth\/v1\//,
    ALL_API: /\/rest\/v1\/|\/auth\/v1\/|\/functions\/v1\//,
  };
  
  // Хелперы для типичных проверок
  countProfileRequests(timeWindow?: number): number {
    return this.countRequests(NetworkMonitor.patterns.PROFILES, timeWindow);
  }
  
  countAdminVerifications(timeWindow?: number): number {
    return this.countRequests(NetworkMonitor.patterns.VERIFY_ADMIN, timeWindow);
  }
  
  getFailedRequests(): RequestLog[] {
    return this.requests.filter(req => req.status && req.status >= 400);
  }
  
  // Анализ "лавин" запросов
  detectRequestBursts(pattern: RegExp, threshold = 3, windowMs = 1000): boolean {
    const now = Date.now();
    const recentRequests = this.requests.filter(req => 
      pattern.test(req.url) && (now - req.timestamp) <= windowMs
    );
    return recentRequests.length > threshold;
  }
}
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Используем тип от существующего клиента для совместимости
type SupabaseClientType = SupabaseClient<Database, 'public', any, any>;

interface AdaptiveSupabaseOptions {
  primaryUrl: string;
  primaryKey: string;
  proxyUrl?: string;
  client?: SupabaseClientType;
}

export class AdaptiveSupabaseClient {
  private primaryClient: SupabaseClientType;
  private proxyClient?: SupabaseClientType;
  private currentClient: SupabaseClientType;
  private isUsingProxy = false;
  private _primaryUrl: string;
  private _primaryKey: string;
  private preferProxy: boolean = false;

  constructor(options: AdaptiveSupabaseOptions) {
    this._primaryUrl = options.primaryUrl;
    this._primaryKey = options.primaryKey;
    
    // Detect if we're in UAE or on mobile network
    this.preferProxy = this.shouldPreferProxy();
    
    if (options.client) {
      this.primaryClient = options.client;
    } else {
      this.primaryClient = createClient<Database>(options.primaryUrl, options.primaryKey);
    }

    if (options.proxyUrl) {
      this.proxyClient = createClient<Database>(options.proxyUrl, options.primaryKey);
    }

    // Set initial client based on preference
    if (this.preferProxy && this.proxyClient) {
      this.currentClient = this.proxyClient;
      this.isUsingProxy = true;
      console.log('🌍 Starting with proxy client (UAE/Mobile network detected)');
    } else {
      this.currentClient = this.primaryClient;
      console.log('🌍 Starting with direct client');
    }
  }

  // Expose URL and key for compatibility
  get supabaseUrl(): string {
    return this._primaryUrl;
  }

  get supabaseKey(): string {
    return this._primaryKey;
  }

  private shouldPreferProxy(): boolean {
    // Check timezone (UAE is +04:00)
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const isUAE = timezone === 'Asia/Dubai' || timezone === 'Asia/Muscat';
    
    // Check network connection type
    const connection = (navigator as any)?.connection || (navigator as any)?.mozConnection || (navigator as any)?.webkitConnection;
    const isMobile = connection?.type === 'cellular' || connection?.effectiveType === '2g' || connection?.effectiveType === '3g';
    
    // Check user agent for mobile
    const isMobileUA = /iPhone|iPad|iPod|Android|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    console.log('🔍 Network detection:', { timezone, isUAE, isMobile, isMobileUA });
    
    return isUAE || isMobile || isMobileUA;
  }

  async testConnection(client: SupabaseClientType): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const { error } = await client.from('profiles').select('id').limit(1);
      clearTimeout(timeoutId);
      
      const success = !error;
      console.log(`🔗 Connection test: ${success ? 'SUCCESS' : 'FAILED'}`, error ? error.message : '');
      return success;
    } catch (err) {
      console.log('🔗 Connection test: FAILED (network error)', err);
      return false;
    }
  }

  async switchToProxy(): Promise<boolean> {
    if (!this.proxyClient) {
      console.warn('Proxy client not configured');
      return false;
    }

    const isProxyWorking = await this.testConnection(this.proxyClient);
    
    if (isProxyWorking) {
      this.currentClient = this.proxyClient;
      this.isUsingProxy = true;
      console.log('Switched to proxy client');
      return true;
    }

    return false;
  }

  switchToPrimary(): void {
    this.currentClient = this.primaryClient;
    this.isUsingProxy = false;
    console.log('Switched to primary client');
  }

  get client(): SupabaseClientType {
    return this.currentClient;
  }

  get usingProxy(): boolean {
    return this.isUsingProxy;
  }

  // Proxy all Supabase methods to current client
  get auth() {
    return this.currentClient.auth;
  }

  get storage() {
    return this.currentClient.storage;
  }

  get functions() {
    return this.currentClient.functions;
  }

  get rpc() {
    return this.currentClient.rpc.bind(this.currentClient);
  }

  from(table: string) {
    return this.currentClient.from(table);
  }

  channel(name: string) {
    return this.currentClient.channel(name);
  }

  removeChannel(channel: any) {
    return this.currentClient.removeChannel(channel);
  }

  // Additional methods that might be used
  schema(name: 'public' | '__InternalSupabase' = 'public') {
    return this.currentClient.schema(name);
  }

  get realtime() {
    return this.currentClient.realtime;
  }

  async initializeConnection(): Promise<void> {
    let connectionEstablished = false;

    // Test current client first
    console.log(`🔄 Testing ${this.isUsingProxy ? 'proxy' : 'direct'} connection...`);
    const currentWorks = await this.testConnection(this.currentClient);
    
    if (currentWorks) {
      console.log(`✅ ${this.isUsingProxy ? 'Proxy' : 'Direct'} connection established`);
      return;
    }

    // If current client failed, try the other one
    if (this.isUsingProxy && this.primaryClient) {
      console.log('🔄 Proxy failed, testing direct connection...');
      const directWorks = await this.testConnection(this.primaryClient);
      if (directWorks) {
        this.switchToPrimary();
        console.log('✅ Switched to direct connection');
        connectionEstablished = true;
      }
    } else if (!this.isUsingProxy && this.proxyClient) {
      console.log('🔄 Direct failed, testing proxy connection...');
      const proxyWorks = await this.testConnection(this.proxyClient);
      if (proxyWorks) {
        this.currentClient = this.proxyClient;
        this.isUsingProxy = true;
        console.log('✅ Switched to proxy connection');
        connectionEstablished = true;
      }
    }

    if (!connectionEstablished) {
      console.error('❌ Both connection methods failed');
    }
  }
}

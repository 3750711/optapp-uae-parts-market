
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Используем тип от существующего клиента для совместимости
type SupabaseClientType = SupabaseClient<Database, 'public', any>;

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

  constructor(options: AdaptiveSupabaseOptions) {
    if (options.client) {
      this.primaryClient = options.client;
      this.currentClient = options.client;
    } else {
      this.primaryClient = createClient<Database>(options.primaryUrl, options.primaryKey);
      this.currentClient = this.primaryClient;
    }

    if (options.proxyUrl) {
      this.proxyClient = createClient<Database>(options.proxyUrl, options.primaryKey);
    }
  }

  async testConnection(client: SupabaseClientType): Promise<boolean> {
    try {
      const { error } = await client.from('profiles').select('id').limit(1);
      return !error;
    } catch {
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
}

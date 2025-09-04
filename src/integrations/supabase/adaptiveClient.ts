import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Simple wrapper for compatibility with existing code
type SupabaseClientType = SupabaseClient<Database, 'public', any, any>;

interface AdaptiveSupabaseOptions {
  primaryUrl: string;
  primaryKey: string;
  proxyUrl?: string;
  client?: SupabaseClientType;
}

export class AdaptiveSupabaseClient {
  private client: SupabaseClientType;
  private _primaryUrl: string;
  private _primaryKey: string;

  constructor(options: AdaptiveSupabaseOptions) {
    this._primaryUrl = options.primaryUrl;
    this._primaryKey = options.primaryKey;
    
    if (options.client) {
      this.client = options.client;
    } else {
      throw new Error('Client must be provided');
    }

    console.log('🌍 Supabase Client initialized:', this._primaryUrl);
  }

  // Return the Supabase URL
  get supabaseUrl(): string {
    return this._primaryUrl;
  }

  get supabaseKey(): string {
    return this._primaryKey;
  }

  get usingProxy(): boolean {
    return false;
  }

  // Proxy all Supabase methods to the client
  get auth() {
    return this.client.auth;
  }

  get storage() {
    return this.client.storage;
  }

  get functions() {
    return this.client.functions;
  }

  get rpc() {
    return this.client.rpc.bind(this.client);
  }

  from(table: string) {
    return this.client.from(table);
  }

  channel(name: string) {
    return this.client.channel(name);
  }

  removeChannel(channel: any) {
    return this.client.removeChannel(channel);
  }

  schema(name: 'public' | '__InternalSupabase' = 'public') {
    return this.client.schema(name);
  }

  get realtime() {
    return this.client.realtime;
  }
}

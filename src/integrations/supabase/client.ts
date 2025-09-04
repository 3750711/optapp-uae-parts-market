
import type { Database } from './types';
import { getSupabaseClient } from '@/lib/supabaseClient';

type SupabaseClientType = ReturnType<typeof import('@supabase/supabase-js').createClient<Database>>;

// Cache for the initialized client
let _supabaseClient: SupabaseClientType | null = null;
let _initializationPromise: Promise<SupabaseClientType> | null = null;

// Initialize client once and cache the promise
const ensureClientInitialized = async (): Promise<SupabaseClientType> => {
  if (_supabaseClient) {
    return _supabaseClient;
  }
  
  if (!_initializationPromise) {
    _initializationPromise = getSupabaseClient();
  }
  
  try {
    _supabaseClient = await _initializationPromise;
    console.log('🌍 Supabase client initialized successfully with runtime config');
    return _supabaseClient;
  } catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error);
    // Reset promise so we can retry
    _initializationPromise = null;
    throw error;
  }
};

// Start initialization immediately
ensureClientInitialized().catch(error => {
  console.error('Early Supabase client initialization failed:', error);
});

// Proxy object that forwards all calls to the actual client
export const supabase = new Proxy({} as SupabaseClientType, {
  get(target, prop) {
    // For async initialization, return a promise that resolves to the method call
    if (prop === 'then' || prop === 'catch' || prop === 'finally') {
      // If someone tries to await the supabase object directly, initialize it first
      return ensureClientInitialized().then(client => client)[prop as keyof Promise<SupabaseClientType>];
    }
    
    // For synchronous access, check if client is ready
    if (!_supabaseClient) {
      // If not ready, throw a descriptive error with guidance
      throw new Error(
        `Supabase client not yet initialized. Use 'await getSupabaseClient()' or ensure the app has fully loaded. ` +
        `Current state: ${_initializationPromise ? 'initializing' : 'not started'}`
      );
    }
    
    const value = _supabaseClient[prop as keyof SupabaseClientType];
    
    // Bind methods to maintain proper context
    if (typeof value === 'function') {
      return value.bind(_supabaseClient);
    }
    
    return value;
  }
});

// Also export the Promise-based client for new code
export { getSupabaseClient };

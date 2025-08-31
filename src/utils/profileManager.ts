// Profile manager with localStorage versioning and cross-user safety
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type UserProfile = Database["public"]["Tables"]["profiles"]["Row"];

interface ProfileCacheEntry {
  profile: UserProfile;
  timestamp: number;
  version: number;
  userId: string;
}

interface ProfileManagerConfig {
  ttlMs: number;
  version: number;
  storagePrefix: string;
}

class ProfileManager {
  private static instance: ProfileManager;
  private config: ProfileManagerConfig = {
    ttlMs: 5 * 60 * 1000, // 5 minutes
    version: 2, // Increment when profile schema changes
    storagePrefix: 'pb-profile:v2'
  };
  private memoryCache = new Map<string, ProfileCacheEntry>();

  private constructor() {}

  static getInstance(): ProfileManager {
    if (!ProfileManager.instance) {
      ProfileManager.instance = new ProfileManager();
    }
    return ProfileManager.instance;
  }

  private getStorageKey(userId: string): string {
    return `${this.config.storagePrefix}:${userId}`;
  }

  private isValidCacheEntry(entry: ProfileCacheEntry, userId: string): boolean {
    if (!entry || entry.version !== this.config.version) {
      return false;
    }
    
    if (entry.userId !== userId) {
      console.warn('⚠️ Profile: Cache userId mismatch!', {
        cached: entry.userId,
        requested: userId
      });
      return false;
    }
    
    const age = Date.now() - entry.timestamp;
    return age < this.config.ttlMs;
  }

  private saveToStorage(userId: string, profile: UserProfile) {
    if (typeof window === 'undefined') return;

    const entry: ProfileCacheEntry = {
      profile,
      timestamp: Date.now(),
      version: this.config.version,
      userId
    };

    try {
      // Save to localStorage (persistent across sessions)
      localStorage.setItem(this.getStorageKey(userId), JSON.stringify(entry));
      
      // Save to memory cache for fast access
      this.memoryCache.set(userId, entry);
      
      console.log('💾 Profile: Saved to storage for user:', userId);
    } catch (error) {
      console.warn('⚠️ Profile: Failed to save to localStorage:', error);
    }
  }

  private loadFromStorage(userId: string): UserProfile | null {
    if (typeof window === 'undefined') return null;

    try {
      // First check memory cache
      const memoryCached = this.memoryCache.get(userId);
      if (memoryCached && this.isValidCacheEntry(memoryCached, userId)) {
        console.log('🔄 Profile: Using memory cache for user:', userId);
        return memoryCached.profile;
      }

      // Then check localStorage
      const stored = localStorage.getItem(this.getStorageKey(userId));
      if (!stored) return null;

      const entry: ProfileCacheEntry = JSON.parse(stored);
      if (!this.isValidCacheEntry(entry, userId)) {
        // Clean up invalid cache
        this.clearStorage(userId);
        return null;
      }

      // Update memory cache with fresh data from localStorage
      this.memoryCache.set(userId, entry);
      console.log('🔄 Profile: Loaded from localStorage for user:', userId);
      return entry.profile;
      
    } catch (error) {
      console.warn('⚠️ Profile: Failed to load from storage:', error);
      this.clearStorage(userId);
      return null;
    }
  }

  private clearStorage(userId: string) {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(this.getStorageKey(userId));
      this.memoryCache.delete(userId);
      console.log('🧹 Profile: Cleared storage for user:', userId);
    } catch (error) {
      console.warn('⚠️ Profile: Failed to clear storage:', error);
    }
  }

  async fetchProfile(userId: string, options: { force?: boolean } = {}): Promise<UserProfile | null> {
    const { force = false } = options;

    console.log(`👤 Profile: Fetching for user ${userId} (force: ${force})`);

    // Check cache first (unless forced)
    if (!force) {
      const cached = this.loadFromStorage(userId);
      if (cached) {
        return cached;
      }
    }

    try {
      console.log('🌐 Profile: Fetching from server for user:', userId);
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('👤 Profile: No profile found for user:', userId);
          return null;
        }
        throw error;
      }

      if (data) {
        console.log('✅ Profile: Successfully fetched from server');
        this.saveToStorage(userId, data);
        return data;
      }

      return null;
    } catch (error) {
      console.error('❌ Profile: Fetch error:', error);
      
      // On error, try to return cached data even if expired
      const cached = this.loadFromStorage(userId);
      if (cached) {
        console.log('🔄 Profile: Returning stale cache due to fetch error');
        return cached;
      }
      
      throw error;
    }
  }

  updateProfile(userId: string, profile: UserProfile) {
    console.log('📝 Profile: Updating cache for user:', userId);
    this.saveToStorage(userId, profile);
  }

  invalidateProfile(userId: string) {
    console.log('🗑️ Profile: Invalidating cache for user:', userId);
    this.clearStorage(userId);
  }

  // Clear all profiles (for signout or user change)
  clearAllProfiles() {
    if (typeof window === 'undefined') return;

    console.log('🧹 Profile: Clearing all cached profiles');
    
    try {
      // Clear memory cache
      this.memoryCache.clear();
      
      // Clear localStorage entries
      const keys = Object.keys(localStorage);
      const profileKeys = keys.filter(key => key.startsWith(this.config.storagePrefix));
      profileKeys.forEach(key => localStorage.removeItem(key));
      
      console.log(`🧹 Profile: Cleared ${profileKeys.length} profile cache entries`);
    } catch (error) {
      console.warn('⚠️ Profile: Failed to clear all profiles:', error);
    }
  }

  // Migrate from old cache format
  migrateFromSessionStorage() {
    if (typeof window === 'undefined') return;

    try {
      const sessionKeys = Object.keys(sessionStorage);
      const oldProfileKeys = sessionKeys.filter(key => key.startsWith('profile_'));
      
      if (oldProfileKeys.length > 0) {
        console.log(`🔄 Profile: Migrating ${oldProfileKeys.length} profiles from sessionStorage`);
        
        oldProfileKeys.forEach(key => {
          try {
            const userId = key.replace('profile_', '');
            const data = sessionStorage.getItem(key);
            const timeKey = `${key}_time`;
            const timeData = sessionStorage.getItem(timeKey);
            
            if (data && timeData) {
              const profile = JSON.parse(data);
              const timestamp = parseInt(timeData, 10);
              
              // Only migrate if not too old (within 1 hour)
              if (Date.now() - timestamp < 3600000) {
                this.saveToStorage(userId, profile);
                console.log(`✅ Profile: Migrated profile for user ${userId}`);
              }
            }
            
            // Clean up old sessionStorage entries
            sessionStorage.removeItem(key);
            sessionStorage.removeItem(timeKey);
          } catch (error) {
            console.warn(`⚠️ Profile: Failed to migrate ${key}:`, error);
            sessionStorage.removeItem(key);
          }
        });
        
        console.log('✅ Profile: Migration from sessionStorage completed');
      }
    } catch (error) {
      console.warn('⚠️ Profile: Migration error:', error);
    }
  }

  // Get cache statistics for debugging
  getCacheStats() {
    const memoryEntries = this.memoryCache.size;
    let localStorageEntries = 0;
    
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      localStorageEntries = keys.filter(key => key.startsWith(this.config.storagePrefix)).length;
    }
    
    return {
      memoryEntries,
      localStorageEntries,
      version: this.config.version,
      ttlMs: this.config.ttlMs
    };
  }
}

export const profileManager = ProfileManager.getInstance();
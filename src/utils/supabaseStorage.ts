import localforage from "localforage";

// Configure localforage for stable auth storage
localforage.config({ 
  name: "partsbay-auth", 
  storeName: "sessions" 
});

export const idbAuthStorage = {
  async getItem(key: string): Promise<string | null> { 
    return (await localforage.getItem<string>(key)) ?? null; 
  },
  async setItem(key: string, value: string): Promise<void> { 
    await localforage.setItem(key, value); 
  },
  async removeItem(key: string): Promise<void> { 
    await localforage.removeItem(key); 
  },
};
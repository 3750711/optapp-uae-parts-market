// Shared telegram configuration helper
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Fetch local telegram accounts from database
 * This replaces the hardcoded localTelegramAccounts arrays
 */
export async function getLocalTelegramAccounts(): Promise<string[]> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? "",
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
    );

    const { data, error } = await supabase
      .from('telegram_accounts_config')
      .select('telegram_username')
      .eq('is_local', true);

    if (error) {
      console.error('Error fetching local telegram accounts:', error);
      // Fallback to empty array if database fails
      return [];
    }

    const accounts = data.map(account => account.telegram_username);
    console.log(`Loaded ${accounts.length} local telegram accounts from database:`, accounts);
    
    return accounts;
  } catch (error) {
    console.error('Exception in getLocalTelegramAccounts:', error);
    return [];
  }
}

/**
 * Determine which Telegram to display in notifications
 * @param telegram The seller's telegram username
 * @param localAccounts Array of local telegram accounts
 * @returns The telegram to display or fallback message
 */
export function getTelegramForDisplay(telegram: string, localAccounts: string[]): string {
  if (!telegram) {
    return '@Nastya_PostingLots_OptCargo';
  }
  
  // Normalize telegram username for comparison
  const normalizedTelegram = telegram.toLowerCase().replace('@', '');
  const isLocalAccount = localAccounts.some(account => 
    account.toLowerCase() === normalizedTelegram
  );
  
  if (isLocalAccount) {
    // Show real telegram for local accounts
    return `@${normalizedTelegram}`;
  } else {
    // Redirect to central contact for non-local accounts
    return '@Nastya_PostingLots_OptCargo';
  }
}
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function SessionWatchdog() {
  useEffect(() => {
    const handleVisibilityOrFocus = async () => {
      // Only refresh when page becomes visible/focused
      if (document.visibilityState !== "visible") return;
      
      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        
        if (!session?.expires_at) return;
        
        const expirationTime = session.expires_at * 1000;
        const timeUntilExpiration = expirationTime - Date.now();
        
        // If token expires within 2 minutes, refresh it
        if (timeUntilExpiration < 120_000 && timeUntilExpiration > 0) {
          console.log('SessionWatchdog: Proactively refreshing token');
          await supabase.auth.refreshSession();
        }
      } catch (error) {
        console.log('SessionWatchdog: Failed to refresh session', error);
        // Don't throw - let normal auth flow handle it
      }
    };

    const handleOnline = async () => {
      // When coming back online, check session validity
      setTimeout(handleVisibilityOrFocus, 1000); // Small delay for network to stabilize
    };

    // Listen to visibility, focus, and online events
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);
    window.addEventListener("online", handleOnline);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return null; // This component doesn't render anything
}
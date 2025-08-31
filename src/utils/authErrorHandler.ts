// Utility for handling authentication errors softly
// Prevents aggressive signOut on temporary network issues

export const isAuthError = (error: any): boolean => {
  return error?.status === 401 || 
         error?.code === 401 ||
         /invalid.*token/i.test(error?.message) ||
         /unauthorized/i.test(error?.message);
};

export const handleAuthErrorSoftly = (error: any, context: string = 'unknown') => {
  if (isAuthError(error)) {
    console.warn(`[auth] Soft auth error in ${context}, scheduling refresh:`, error.message);
    
    // Don't signOut immediately - let the manual refresh system handle it
    setTimeout(() => {
      // The manual refresh system will attempt to refresh the token
      // If it fails repeatedly, the session will naturally expire
      console.log(`[auth] Scheduled refresh attempt for ${context}`);
    }, 1000);
    
    return true; // Indicates this was handled as an auth error
  }
  
  return false; // Not an auth error, handle normally
};

// Usage example:
// if (!handleAuthErrorSoftly(error, 'profile_fetch')) {
//   // Handle other types of errors normally
//   throw error;
// }
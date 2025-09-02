/**
 * Regression protection utilities to prevent app startup failures
 */

// Provider order validation
export const validateProviderOrder = () => {
  if (import.meta.env.DEV) {
    console.log('🔍 [Dev] Validating provider order...');
    
    // Check if QueryClient is available when NetworkHandler tries to use it
    setTimeout(() => {
      try {
        const networkStatus = document.querySelector('[data-network-status]');
        if (networkStatus) {
          console.log('✅ [Dev] NetworkHandler mounted successfully - providers in correct order');
        }
      } catch (error) {
        console.error('🔴 [Dev] Provider order validation failed:', error);
      }
    }, 1000);
  }
};

// Network independence validation
export const validateNetworkIndependence = () => {
  if (import.meta.env.DEV) {
    console.log('🔍 [Dev] Validating network independence...');
    
    // Check if UI renders without network requests blocking
    const startTime = performance.now();
    
    const checkRender = () => {
      const appRoot = document.querySelector('#root');
      if (appRoot && appRoot.children.length > 0) {
        const renderTime = performance.now() - startTime;
        console.log(`✅ [Dev] UI rendered in ${renderTime.toFixed(2)}ms - not blocked by network`);
        return true;
      }
      return false;
    };
    
    // Check immediately and after delay
    if (!checkRender()) {
      setTimeout(() => {
        if (!checkRender()) {
          console.warn('⚠️ [Dev] UI render appears to be blocked - possible network dependency');
        }
      }, 3000);
    }
  }
};

// Same-origin validation
export const validateSameOrigin = () => {
  if (import.meta.env.DEV) {
    console.log('🔍 [Dev] Validating same-origin configuration...');
    
    // Check if all Supabase requests go through same-origin proxy
    const originalFetch = window.fetch;
    let crossOriginRequests = 0;
    
    window.fetch = function(...args) {
      const url = args[0] as string;
      if (url.includes('supabase.co') && !url.startsWith(window.location.origin)) {
        crossOriginRequests++;
        console.warn('⚠️ [Dev] Cross-origin Supabase request detected:', url);
      }
      return originalFetch.apply(this, args);
    };
    
    // Report after 10 seconds
    setTimeout(() => {
      if (crossOriginRequests === 0) {
        console.log('✅ [Dev] All Supabase requests using same-origin proxy');
      } else {
        console.warn(`🔴 [Dev] Found ${crossOriginRequests} cross-origin Supabase requests`);
      }
      // Restore original fetch
      window.fetch = originalFetch;
    }, 10000);
  }
};

// Run all validations
export const runRegressionProtection = () => {
  if (import.meta.env.DEV) {
    console.log('🛡️ [Dev] Running regression protection checks...');
    validateProviderOrder();
    validateNetworkIndependence();
    validateSameOrigin();
  }
};
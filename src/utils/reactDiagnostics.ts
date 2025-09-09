/**
 * React Dispatcher Diagnostics Utility
 * Provides comprehensive diagnostics for React initialization issues
 */
import React from 'react';

export interface ReactDiagnostics {
  reactVersion: string;
  dispatcherExists: boolean;
  hooksAvailable: boolean;
  internalState: 'ready' | 'loading' | 'error';
  timestamp: number;
  moduleLoadState: string;
}

export function runReactDiagnostics(): ReactDiagnostics {
  const timestamp = Date.now();
  
  try {
    // Check React version
    const reactVersion = (React as any).version || 'unknown';
    
    // Check dispatcher state
    const ReactInternals = (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
    const dispatcher = ReactInternals?.ReactCurrentDispatcher?.current;
    const dispatcherExists = !!dispatcher;
    
    // Check hook availability
    const hooksAvailable = typeof React.useState === 'function' && 
                          typeof React.useEffect === 'function';
    
    // Determine internal state
    let internalState: 'ready' | 'loading' | 'error' = 'error';
    if (dispatcherExists && hooksAvailable) {
      internalState = 'ready';
    } else if (hooksAvailable) {
      internalState = 'loading';
    }
    
    // Check module load state
    const moduleLoadState = document.readyState;
    
    return {
      reactVersion,
      dispatcherExists,
      hooksAvailable,
      internalState,
      timestamp,
      moduleLoadState
    };
  } catch (error) {
    return {
      reactVersion: 'error',
      dispatcherExists: false,
      hooksAvailable: false,
      internalState: 'error',
      timestamp,
      moduleLoadState: 'error'
    };
  }
}

export function logReactDiagnostics(label: string = 'React Diagnostics') {
  const diagnostics = runReactDiagnostics();
  console.log(`🔍 [${label}]`, diagnostics);
  
  if (diagnostics.internalState === 'error') {
    console.error('❌ React is not properly initialized');
  } else if (diagnostics.internalState === 'loading') {
    console.warn('⏳ React hooks available but dispatcher not ready');
  } else {
    console.log('✅ React fully initialized and ready');
  }
  
  return diagnostics;
}
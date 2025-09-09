// Enhanced authentication diagnostics and recovery utilities

import { supabase } from "@/integrations/supabase/client";
import { isNetworkError } from "./authErrorHandler";

export interface AuthDiagnosticResult {
  status: 'healthy' | 'degraded' | 'critical';
  issues: string[];
  recommendations: string[];
  data: {
    sessionExists: boolean;
    profileExists: boolean;
    firstLoginCompleted: boolean;
    dataSyncIssues: string[];
    networkStatus: 'online' | 'offline' | 'unstable';
  };
}

export interface FullAuthDiagnostic {
  user_id: string;
  timestamp: string;
  auth_exists: boolean;
  profile_exists: boolean;
  email_confirmed: boolean;
  auth_email: string;
  profile_email: string;
  auth_user_type: string;
  profile_user_type: string;
  first_login_completed: boolean;
  profile_completed: boolean;
  verification_status: string;
  auth_method: string;
  data_sync_issues: {
    email_mismatch: boolean;
    user_type_mismatch: boolean;
    missing_profile: boolean;
  };
}

// Quick diagnostic check for common auth issues
export async function quickAuthDiagnostic(): Promise<AuthDiagnosticResult> {
  const result: AuthDiagnosticResult = {
    status: 'healthy',
    issues: [],
    recommendations: [],
    data: {
      sessionExists: false,
      profileExists: false,
      firstLoginCompleted: false,
      dataSyncIssues: [],
      networkStatus: navigator.onLine ? 'online' : 'offline'
    }
  };

  try {
    // Check session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError && isNetworkError(sessionError)) {
      result.status = 'degraded';
      result.issues.push('Network connectivity issues detected');
      result.data.networkStatus = 'unstable';
      result.recommendations.push('Check internet connection and try again');
      return result;
    }

    result.data.sessionExists = !!session;

    if (!session) {
      result.status = 'critical';
      result.issues.push('No active session found');
      result.recommendations.push('User needs to log in');
      return result;
    }

    // Check profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_login_completed, profile_completed, user_type, email, auth_method')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      result.status = 'critical';
      result.issues.push('Profile data missing or inaccessible');
      result.recommendations.push('Profile needs to be created or restored');
      return result;
    }

    result.data.profileExists = !!profile;
    result.data.firstLoginCompleted = profile.first_login_completed;

    // Check for data sync issues
    if (session.user.email !== profile.email) {
      result.issues.push('Email mismatch between auth and profile');
      result.data.dataSyncIssues.push('email_mismatch');
    }

    if (!profile.first_login_completed && profile.auth_method !== 'telegram') {
      result.issues.push('First login setup not completed');
      result.recommendations.push('Complete profile setup');
    }

    // Determine overall status
    if (result.issues.length > 0) {
      result.status = result.issues.some(issue => 
        issue.includes('critical') || 
        issue.includes('missing') || 
        issue.includes('inaccessible')
      ) ? 'critical' : 'degraded';
    }

    return result;

  } catch (error) {
    console.error('Error during auth diagnostic:', error);
    result.status = 'critical';
    result.issues.push(`Diagnostic failed: ${error.message}`);
    result.recommendations.push('Contact support if issue persists');
    return result;
  }
}

// Full diagnostic using database function
export async function fullAuthDiagnostic(userId?: string): Promise<FullAuthDiagnostic | null> {
  try {
    const { data, error } = await supabase.rpc('diagnose_auth_state', 
      userId ? { p_user_id: userId } : {}
    );
    
    if (error) {
      console.error('Full diagnostic failed:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error running full diagnostic:', error);
    return null;
  }
}

// Attempt to fix common auth issues
export async function attemptAuthRecovery(): Promise<{ success: boolean; message: string }> {
  try {
    const diagnostic = await quickAuthDiagnostic();
    
    if (diagnostic.status === 'healthy') {
      return { success: true, message: 'Authentication is working correctly' };
    }

    // Attempt network recovery
    if (diagnostic.data.networkStatus === 'unstable') {
      console.log('🔄 Attempting network recovery...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const retryDiagnostic = await quickAuthDiagnostic();
      if (retryDiagnostic.status === 'healthy') {
        return { success: true, message: 'Network issue resolved' };
      }
    }

    // Attempt session refresh
    if (diagnostic.data.sessionExists) {
      console.log('🔄 Attempting session refresh...');
      const { error } = await supabase.auth.refreshSession();
      if (!error) {
        return { success: true, message: 'Session refreshed successfully' };
      }
    }

    return { 
      success: false, 
      message: `Recovery failed: ${diagnostic.issues.join(', ')}` 
    };

  } catch (error) {
    console.error('Auth recovery failed:', error);
    return { 
      success: false, 
      message: `Recovery error: ${error.message}` 
    };
  }
}

// Log auth state for debugging
export function logAuthState(context: string = 'unknown'): void {
  console.group(`🔍 Auth State Debug (${context})`);
  
  supabase.auth.getSession().then(({ data: { session } }) => {
    console.log('Session exists:', !!session);
    if (session) {
      console.log('User ID:', session.user.id);
      console.log('Email:', session.user.email);
      console.log('Token expires:', new Date(session.expires_at * 1000));
    }
  });
  
  console.log('Navigator online:', navigator.onLine);
  console.log('Timestamp:', new Date().toISOString());
  console.groupEnd();
}
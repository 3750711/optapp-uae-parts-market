// Optional debug component for troubleshooting authentication issues
// Add this to any page temporarily for debugging: <AuthDebugPanel />

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { quickAuthDiagnostic, fullAuthDiagnostic } from '@/utils/authDiagnostics';

export const AuthDebugPanel: React.FC = () => {
  const { user, profile, session, needsFirstLoginCompletion, runDiagnostic } = useAuth();
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runQuickDiagnostic = async () => {
    setIsRunning(true);
    try {
      const result = await quickAuthDiagnostic();
      setDiagnosticResult({ type: 'quick', result });
    } catch (error) {
      setDiagnosticResult({ type: 'error', error: error.message });
    }
    setIsRunning(false);
  };

  const runFullDiagnostic = async () => {
    if (!user?.id) return;
    
    setIsRunning(true);
    try {
      const result = await fullAuthDiagnostic(user.id);
      setDiagnosticResult({ type: 'full', result });
    } catch (error) {
      setDiagnosticResult({ type: 'error', error: error.message });
    }
    setIsRunning(false);
  };

  return (
    <div className="fixed bottom-4 right-4 bg-card border rounded-lg p-4 shadow-lg max-w-md z-50">
      <h3 className="font-semibold text-sm mb-2">🔍 Auth Debug Panel</h3>
      
      <div className="text-xs space-y-1 mb-3">
        <div>Session: <span className={session ? 'text-success' : 'text-destructive'}>{session ? '✅' : '❌'}</span></div>
        <div>User: <span className={user ? 'text-success' : 'text-destructive'}>{user ? '✅' : '❌'}</span></div>
        <div>Profile: <span className={profile ? 'text-success' : 'text-destructive'}>{profile ? '✅' : '❌'}</span></div>
        <div>First Login: <span className={!needsFirstLoginCompletion ? 'text-success' : 'text-warning'}>
          {needsFirstLoginCompletion ? '⚠️ Required' : '✅ Complete'}
        </span></div>
        {profile && (
          <div>Type: <span className="text-primary">{profile.user_type}</span></div>
        )}
      </div>

      <div className="flex gap-2 mb-3">
        <button 
          onClick={runQuickDiagnostic}
          disabled={isRunning}
          className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs"
        >
          Quick Test
        </button>
        <button 
          onClick={runFullDiagnostic}
          disabled={isRunning || !user}
          className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs"
        >
          Full Test
        </button>
        <button 
          onClick={runDiagnostic}
          disabled={isRunning}
          className="px-2 py-1 bg-accent text-accent-foreground rounded text-xs"
        >
          Context Test
        </button>
      </div>

      {diagnosticResult && (
        <div className="text-xs p-2 bg-muted rounded max-h-32 overflow-auto">
          <pre>{JSON.stringify(diagnosticResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FLAGS } from '@/config/flags';
import { decodeJwt } from '@/auth/jwtHelpers';
import { getRuntimeSupabaseUrl, getRuntimeAnonKey } from '@/config/runtimeSupabase';
import { getProjectRef } from '@/auth/projectRef';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthInspect() {
  const { session, user, status, profile } = useAuth();
  const [inspectData, setInspectData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const updateInspectData = () => {
    const runtime = (window as any).__PB_RUNTIME__ || {};
    const anonKey = getRuntimeAnonKey();
    const projectRef = getProjectRef();
    
    // JWT metadata from session with TTL calculation
    let jwtMeta = null;
    let tokenTTL = 0;
    if (session?.access_token) {
      const jwt = decodeJwt<any>(session.access_token);
      if (jwt) {
        tokenTTL = Math.max(0, jwt.exp - Math.floor(Date.now() / 1000));
        jwtMeta = {
          iss: jwt.iss,
          sub: jwt.sub,
          exp: jwt.exp,
          ttl: tokenTTL,
          ttlMin: Math.floor(tokenTTL / 60),
          expired: tokenTTL <= 0
        };
      }
    }

    // Auth storage scan
    const storageKeys: any[] = [];
    ['localStorage', 'sessionStorage'].forEach(storageType => {
      const storage = storageType === 'localStorage' ? localStorage : sessionStorage;
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && (key.includes('supabase') || key.includes('auth'))) {
          const value = storage.getItem(key);
          storageKeys.push({
            key,
            storage: storage === localStorage ? 'localStorage' : 'sessionStorage',
            length: value?.length || 0
          });
        }
      }
    });

    // Realtime state removed
    const realtimeState = { enabled: false, connected: false, message: 'Realtime completely removed' };

    setInspectData({
      timestamp: new Date().toISOString(),
      runtime: {
        SUPABASE_URL: runtime.SUPABASE_URL || getRuntimeSupabaseUrl(),
        anonRef: projectRef,
        locationOrigin: window.location.origin,
        DEBUG_AUTH: runtime.DEBUG_AUTH
      },
      session: {
        hasSession: !!session,
        hasUser: !!user,
        hasToken: !!session?.access_token,
        userId: user?.id,
        userEmail: user?.email,
        tokenTTL: tokenTTL,
        tokenTTLMin: Math.floor(tokenTTL / 60),
        tokenExpired: tokenTTL <= 0,
        sessionCreatedAt: session?.created_at,
        sessionExpiresAt: session?.expires_at,
        sessionRefreshToken: session?.refresh_token ? '✓ Present' : '✗ Missing'
      },
      jwt: jwtMeta,
      profile: {
        hasProfile: !!profile,
        profileId: profile?.id,
        profileType: profile?.user_type,
        verificationStatus: profile?.verification_status
      },
      storage: {
        keys: storageKeys,
        totalKeys: storageKeys.length
      },
      realtime: realtimeState,
      client: {
        url: supabase.supabaseUrl,
        key: supabase.supabaseKey ? '✓ Present' : '✗ Missing',
        keyLength: supabase.supabaseKey?.length || 0,
        keyValidation: anonKey ? 'Valid format' : 'Invalid format'
      }
    });
  };

  useEffect(() => {
    updateInspectData();
  }, [session, user, profile]);

  const testWebSocket101 = async () => {
    setLoading(true);
    try {
      const wsUrl = 'wss://echo.websocket.org';
      console.log('🧪 Testing WebSocket 101 to:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('✅ WebSocket 101 connection opened');
        ws.send('test-message-from-partsbay');
        
        setTimeout(() => {
          ws.close();
          alert('✅ WebSocket 101 test successful');
          setLoading(false);
        }, 1000);
      };
      
      ws.onerror = (error) => {
        console.error('❌ WebSocket 101 error:', error);
        alert('❌ WebSocket 101 test failed');
        setLoading(false);
      };
      
      ws.onclose = () => {
        console.log('🔌 WebSocket 101 connection closed');
        setLoading(false);
      };
      
    } catch (error) {
      console.error('❌ WebSocket test failed:', error);
      alert('❌ WebSocket test failed: ' + error.message);
      setLoading(false);
    }
  };

  const testRealtimePing = async () => {
    alert('Realtime has been completely removed from the project');
    return;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">🔍 Auth Inspector</h1>
        <button 
          onClick={updateInspectData}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="grid gap-6">
        {/* Quick Actions */}
        <div className="bg-card p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">⚡ Quick Tests</h2>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={testWebSocket101}
              disabled={loading}
              className="px-4 py-2 bg-success text-success-foreground rounded hover:bg-success/90 disabled:opacity-50"
            >
              🔌 Test WebSocket 101
            </button>
          </div>
        </div>

        {/* Feature Flags */}
        <div className="bg-card p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">🚩 Feature Flags</h2>
          <div className="space-y-2">
            <div className="px-3 py-2 rounded bg-red-100 text-red-800">
              <span className="font-medium">Realtime: </span>
              <span>🚫 Completely Removed</span>
            </div>
            <div className={`px-3 py-2 rounded ${FLAGS.DEBUG_AUTH ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
              <span className="font-medium">Debug Auth: </span>
              <span>{FLAGS.DEBUG_AUTH ? '✅ Enabled' : '❌ Disabled'}</span>
            </div>
          </div>
        </div>

        {/* Inspection Data */}
        <div className="bg-card p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">📊 Inspection Data</h2>
          <pre className="whitespace-pre-wrap text-xs bg-muted p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(inspectData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
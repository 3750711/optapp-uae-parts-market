import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FLAGS } from '@/config/flags';
import { decodeJwt } from '@/auth/jwtHelpers';
import { getRuntimeSupabaseUrl, getRuntimeAnonKey } from '@/config/runtimeSupabase';
import { getProjectRef } from '@/auth/projectRef';
import { getRealtimeState, forceReconnect } from '@/utils/realtimeManager';
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
          expDate: jwt.exp ? new Date(jwt.exp * 1000).toISOString() : null,
          ttlSeconds: tokenTTL,
          ttlMinutes: Math.floor(tokenTTL / 60),
          role: jwt.role,
          sessionId: jwt.session_id
        };
      }
    }

    // Get expected WebSocket URL
    const wsUrl = `wss://api.partsbay.ae/realtime/v1/websocket?apikey=${anonKey || 'missing'}&vsn=1.0.0`;
    const actualWsUrl = (supabase as any).realtime?.socket?.endPoint || 'Not connected';

    // Get storage keys
    const storageKeys = [];
    for (const storage of [localStorage, sessionStorage]) {
      for (const key of Object.keys(storage)) {
        if (key.startsWith('sb-') || key.startsWith('supabase.auth.')) {
          const value = storage.getItem(key);
          storageKeys.push({
            key,
            storage: storage === localStorage ? 'localStorage' : 'sessionStorage',
            length: value?.length || 0
          });
        }
      }
    }

    const realtimeState = getRealtimeState();

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
        userId: user?.id || null,
        sessionExpiresAt: session?.expires_at || null,
        jwtMeta,
        tokenIsValid: tokenTTL > 0
      },
      websocket: {
        expectedUrl: wsUrl,
        actualUrl: actualWsUrl,
        urlMatches: wsUrl === actualWsUrl,
        socketState: realtimeState.socketState
      },
      storage: {
        keys: storageKeys
      },
      realtime: {
        ...realtimeState
      },
      profile: {
        hasProfile: !!profile,
        userType: profile?.user_type || null,
        profileCompleted: profile?.profile_completed || null
      },
      authContext: {
        status,
        hasUser: !!user,
        hasSession: !!session,
        hasProfile: !!profile
      }
    });
  };

  const testRefresh = async () => {
    setLoading(true);
    try {
      const startTime = Date.now();
      const { error } = await supabase.auth.refreshSession();
      const duration = Date.now() - startTime;
      
      alert(`Refresh ${error ? 'failed' : 'successful'} (${duration}ms)${error ? ': ' + error.message : ''}`);
      updateInspectData();
    } catch (error) {
      alert('Refresh error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const testProfile = async () => {
    if (!user?.id) {
      alert('No user ID available');
      return;
    }

    setLoading(true);
    try {
      const startTime = Date.now();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      const duration = Date.now() - startTime;
      
      alert(`Profile fetch ${error ? 'failed' : 'successful'} (${duration}ms)${error ? ': ' + error.message : ''}`);
      updateInspectData();
    } catch (error) {
      alert('Profile error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const testCors = async () => {
    setLoading(true);
    try {
      const url = `${getRuntimeSupabaseUrl()}/auth/v1/token`;
      const startTime = Date.now();
      
      const response = await fetch(url, {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type,authorization'
        }
      });
      
      const duration = Date.now() - startTime;
      const headers = {
        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
      };
      
      alert(`CORS preflight ${response.ok ? 'successful' : 'failed'} (${duration}ms, status: ${response.status})\nHeaders: ${JSON.stringify(headers, null, 2)}`);
    } catch (error) {
      alert('CORS error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const testWebSocketHandshake = async () => {
    setLoading(true);
    console.log('🔄 Testing WebSocket 101 handshake...');
    
    try {
      const anonKey = getRuntimeAnonKey();
      const wsUrl = `wss://api.partsbay.ae/realtime/v1/websocket?apikey=${anonKey}&vsn=1.0.0`;
      const startTime = Date.now();
      const testSocket = new WebSocket(wsUrl);
      
      const timeout = setTimeout(() => {
        testSocket.close();
        alert('⏰ WebSocket handshake timeout (10s)');
        setLoading(false);
      }, 10000);
      
      testSocket.onopen = () => {
        clearTimeout(timeout);
        const latency = Date.now() - startTime;
        console.log(`✅ WebSocket handshake successful in ${latency}ms`);
        alert(`✅ WebSocket handshake successful in ${latency}ms`);
        testSocket.close();
        setLoading(false);
      };
      
      testSocket.onerror = (error) => {
        clearTimeout(timeout);
        console.error('❌ WebSocket handshake failed:', error);
        alert('❌ WebSocket handshake failed - check console for details');
        setLoading(false);
      };
      
      testSocket.onclose = (event) => {
        clearTimeout(timeout);
        if (event.code !== 1000) {
          console.error(`❌ WebSocket closed with code: ${event.code}, reason: ${event.reason}`);
          alert(`❌ WebSocket closed with code: ${event.code}, reason: ${event.reason}`);
        }
        setLoading(false);
      };
      
    } catch (error) {
      console.error('❌ WebSocket test failed:', error);
      alert('❌ WebSocket test failed: ' + error.message);
      setLoading(false);
    }
  };

  const testRealtimePing = async () => {
    if (!FLAGS.REALTIME_ENABLED) {
      alert('Realtime is disabled by configuration');
      return;
    }

    if (!user?.id) {
      alert('No user ID for realtime test');
      return;
    }

    setLoading(true);
    try {
      const channelName = `audit:${user.id}`;
      const channel = supabase.channel(channelName);
      
      let received = false;
      const timeout = setTimeout(() => {
        if (!received) {
          alert('Realtime ping timeout (10s)');
          channel.unsubscribe();
        }
      }, 10000);

      channel
        .on('broadcast', { event: 'ping' }, (payload) => {
          received = true;
          clearTimeout(timeout);
          alert(`Realtime ping successful! Payload: ${JSON.stringify(payload)}`);
          channel.unsubscribe();
          setLoading(false);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            // Send ping after subscription
            await channel.send({
              type: 'broadcast',
              event: 'ping',
              payload: { message: 'test', timestamp: Date.now() }
            });
          }
        });

    } catch (error) {
      alert('Realtime ping error: ' + error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    updateInspectData();
  }, [session, user, status, profile]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🔍 Auth Inspector</h1>
      
      <div className="grid gap-6">
        {/* Controls */}
        <div className="bg-card p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">🎮 Test Controls</h2>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={updateInspectData}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              🔄 Refresh Data
            </button>
            <button 
              onClick={testRefresh}
              disabled={loading || !session}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 disabled:opacity-50"
            >
              🔑 Test Session Refresh
            </button>
            <button 
              onClick={testProfile}
              disabled={loading || !user}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 disabled:opacity-50"
            >
              👤 Test Profile Fetch
            </button>
            <button 
              onClick={testCors}
              disabled={loading}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 disabled:opacity-50"
            >
              🌐 Test CORS Preflight
            </button>
            <button 
              onClick={testWebSocketHandshake}
              disabled={loading}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 disabled:opacity-50"
            >
              🔌 Test WebSocket 101
            </button>
            {FLAGS.REALTIME_ENABLED && (
              <button 
                onClick={forceReconnect}
                disabled={loading}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 disabled:opacity-50"
              >
                🔌 Force RT Reconnect
              </button>
            )}
          </div>
        </div>

        {/* Feature Flags */}
        <div className="bg-card p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">🚩 Feature Flags</h2>
          <div className="space-y-2">
            <div className={`px-3 py-2 rounded ${FLAGS.REALTIME_ENABLED ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
              <span className="font-medium">Realtime: </span>
              <span>{FLAGS.REALTIME_ENABLED ? '✅ Enabled' : '🚫 Disabled'}</span>
            </div>
            <div className={`px-3 py-2 rounded ${FLAGS.DEBUG_AUTH ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
              <span className="font-medium">Debug Auth: </span>
              <span>{FLAGS.DEBUG_AUTH ? '✅ Enabled' : '❌ Disabled'}</span>
            </div>
          </div>
        </div>

        {/* Realtime Tests - Only show if enabled */}
        {FLAGS.REALTIME_ENABLED && (
          <div className="bg-card p-4 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">📡 Realtime Tests</h2>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={testRealtimePing}
                disabled={loading || !user}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 disabled:opacity-50"
              >
                📡 Test Realtime Ping
              </button>
            </div>
          </div>
        )}

        {/* Runtime & Environment */}
        <div className="bg-card p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">🌍 Runtime & Environment</h2>
          <pre className="bg-muted p-3 rounded text-sm overflow-auto">
            {JSON.stringify(inspectData.runtime, null, 2)}
          </pre>
        </div>

        {/* Session Status */}
        <div className="bg-card p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">🔐 Session Status</h2>
          <pre className="bg-muted p-3 rounded text-sm overflow-auto">
            {JSON.stringify(inspectData.session, null, 2)}
          </pre>
        </div>

        {/* WebSocket Configuration */}
        <div className="bg-card p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">🔌 WebSocket Configuration</h2>
          <pre className="bg-muted p-3 rounded text-sm overflow-auto">
            {JSON.stringify(inspectData.websocket, null, 2)}
          </pre>
        </div>

        {/* Storage Keys */}
        <div className="bg-card p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">💾 Storage Keys</h2>
          <pre className="bg-muted p-3 rounded text-sm overflow-auto">
            {JSON.stringify(inspectData.storage, null, 2)}
          </pre>
        </div>

        {/* Realtime Status */}
        <div className="bg-card p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">📡 Realtime Status</h2>
          <pre className="bg-muted p-3 rounded text-sm overflow-auto">
            {JSON.stringify(inspectData.realtime, null, 2)}
          </pre>
        </div>

        {/* Profile Status */}
        <div className="bg-card p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">👤 Profile Status</h2>
          <pre className="bg-muted p-3 rounded text-sm overflow-auto">
            {JSON.stringify(inspectData.profile, null, 2)}
          </pre>
        </div>

        {/* Auth Context Status */}
        <div className="bg-card p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">📋 Auth Context Status</h2>
          <pre className="bg-muted p-3 rounded text-sm overflow-auto">
            {JSON.stringify(inspectData.authContext, null, 2)}
          </pre>
        </div>

        {/* Debug Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">💡 Debug Instructions</h2>
          <p className="text-sm text-muted-foreground">
            To enable debug logs, run in console: <code className="bg-muted px-2 py-1 rounded">localStorage.setItem('DEBUG_AUTH', '1')</code>
            <br />
            To disable: <code className="bg-muted px-2 py-1 rounded">localStorage.removeItem('DEBUG_AUTH')</code>
          </p>
        </div>
      </div>
    </div>
  );
}
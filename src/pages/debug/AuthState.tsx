import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { decodeJwt } from '@/auth/jwtHelpers';
import { getRuntimeSupabaseUrl, isPreviewEnv } from '@/config/runtimeSupabase';
import { validateSessionIssuer } from '@/auth/authSessionManager';

export default function AuthState() {
  const [state, setState] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const supabase = await getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        const jwt = decodeJwt<any>(session?.access_token);
        setState({
          runtimeSupabaseUrl: getRuntimeSupabaseUrl(),
          isPreviewEnv: isPreviewEnv(),
          hasSession: !!session,
          issCheck: validateSessionIssuer(session?.access_token),
          jwt: jwt ? { iss: jwt.iss, exp: jwt.exp, sub: jwt.sub } : null,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        setState({ error: String(error) });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Auth State Debug</h1>
      <pre className="p-4 bg-gray-100 rounded text-xs overflow-auto whitespace-pre-wrap">
        {JSON.stringify(state, null, 2)}
      </pre>
    </div>
  );
}
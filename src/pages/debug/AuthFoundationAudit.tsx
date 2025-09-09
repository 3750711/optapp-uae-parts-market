import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getRuntimeSupabaseUrl, getRuntimeAnonKey } from '@/config/runtimeSupabase';

const proxyUrl = getRuntimeSupabaseUrl();
const anon = getRuntimeAnonKey();

function decodeJwt<T=any>(t?: string|null): T|null {
  if (!t) return null;
  try { const [,p] = (t as string).split('.'); return JSON.parse(atob(p.replace(/-/g,'+').replace(/_/g,'/'))); } catch { return null; }
}

async function preflight(url: string) {
  const res = await fetch(url, { method: 'OPTIONS', headers: { Origin: location.origin, 'Access-Control-Request-Method': 'POST' }});
  return { status: res.status, ok: res.ok, headers: Object.fromEntries(res.headers.entries()) };
}

async function rawToken(base: string, email: string, password: string) {
  const res = await fetch(`${base}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anon, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  let body:any=null; try { body = await res.json(); } catch { body = await res.text(); }
  return { status: res.status, ok: res.ok, headers: Object.fromEntries(res.headers.entries()), body };
}

export default function AuthFoundationAudit() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [out, setOut] = useState<any>({ runtime: { proxyUrl, hasAnon: !!anon } });

  const run = async () => {
    if (!anon) {
      setOut((o:any) => ({ ...o, error: 'No anon key available' }));
      return;
    }

    const pfProxy = await preflight(`${proxyUrl}/auth/v1/token`);
    const rawProxy = await rawToken(proxyUrl, email, password);
    const sdkProxy = await supabase.auth.signInWithPassword({ email, password });

    const proxyJwt = decodeJwt<any>(sdkProxy?.data?.session?.access_token);
    const issExpected = `${proxyUrl}/auth/v1`;
    const issOk = proxyJwt?.iss?.startsWith(issExpected);

    setOut((o:any) => ({
      ...o,
      preflight: { proxy: pfProxy },
      raw: { proxy: rawProxy },
      sdk: {
        proxy: { status: (sdkProxy.error as any)?.status, ok: !sdkProxy.error, err: sdkProxy.error?.message }
      },
      token: { iss: proxyJwt?.iss, exp: proxyJwt?.exp, issExpected, issOk }
    }));
  };


  return (
    <div className="p-6 max-w-5xl mx-auto space-y-3">
      <h1 className="text-2xl font-bold">Auth Foundation Audit</h1>
      <div className="text-sm opacity-80">
        <div>Proxy URL: <code>{proxyUrl}</code></div>
        <div>Using unified proxy domain only</div>
        <div>Anon present: <code>{String(!!anon)}</code></div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <input className="border rounded p-2" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="border rounded p-2" placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <button onClick={run} className="px-3 py-2 rounded bg-black text-white">Run unified auth test</button>
      </div>
      <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto h-64">{JSON.stringify(out, null, 2)}</pre>
      <p className="text-xs opacity-60">Пароль не логируется. Для прод — удалите страницу после аудита.</p>
    </div>
  );
}
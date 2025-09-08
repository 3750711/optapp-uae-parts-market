import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const rt: any = (globalThis as any).__PB_RUNTIME__ || {};
const proxyUrl = (rt.SUPABASE_URL || 'https://api.partsbay.ae').replace(/\/+$/,'');
const originUrl = (rt.SUPABASE_ORIGIN_URL || '').replace(/\/+$/,''); // опционально, если есть
const anon = rt.SUPABASE_ANON_KEY;

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
  const [out, setOut] = useState<any>({ runtime: { proxyUrl, originUrl, hasAnon: !!anon } });

  const run = async () => {
    const clientProxy = createClient(proxyUrl, anon, { auth: { persistSession: false }});
    const clientOrigin = originUrl ? createClient(originUrl, anon, { auth: { persistSession: false }}) : null;

    const pfProxy = await preflight(`${proxyUrl}/auth/v1/token`);
    const pfOrigin = originUrl ? await preflight(`${originUrl}/auth/v1/token`) : null;

    const rawProxy = await rawToken(proxyUrl, email, password);
    const rawOrigin = originUrl ? await rawToken(originUrl, email, password) : null;

    const sdkProxy = await clientProxy.auth.signInWithPassword({ email, password });
    const sdkOrigin = clientOrigin ? await clientOrigin.auth.signInWithPassword({ email, password }) : { data:null, error:null };

    const proxyJwt = decodeJwt<any>((sdkProxy as any)?.data?.session?.access_token);
    const issExpected = `${proxyUrl}/auth/v1`;
    const issOk = proxyJwt?.iss?.startsWith(issExpected);

    setOut((o:any) => ({
      ...o,
      preflight: { proxy: pfProxy, origin: pfOrigin },
      raw: { proxy: rawProxy, origin: rawOrigin },
      sdk: {
        proxy: { status: (sdkProxy.error as any)?.status, ok: !sdkProxy.error, err: sdkProxy.error?.message },
        origin: { status: (sdkOrigin as any).error?.status, ok: !(sdkOrigin as any).error, err: (sdkOrigin as any).error?.message },
      },
      token: { iss: proxyJwt?.iss, exp: proxyJwt?.exp, issExpected, issOk }
    }));
  };

  const testRealtime = async () => {
    const client = createClient(proxyUrl, anon, { auth: { persistSession: true }});
    const { data: { session } } = await client.auth.getSession();
    await client.realtime.setAuth(session?.access_token || '');
    await client.realtime.connect();
    const ch = client.channel('audit');
    const log:string[] = [];
    const push = (m:string)=>log.push(`[${new Date().toISOString()}] ${m}`);
    ch.on('broadcast', { event: 'ping' }, (p)=>push('recv broadcast ping ' + JSON.stringify(p)));
    await ch.subscribe((s)=>push('status '+s));
    setTimeout(()=>{ try { ch.send({ type:'broadcast', event:'ping', payload:{ t:Date.now() }}); } catch {} }, 500);
    setTimeout(()=>{ ch.unsubscribe(); setOut((o:any)=>({ ...o, realtime: log })); }, 2500);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-3">
      <h1 className="text-2xl font-bold">Auth Foundation Audit</h1>
      <div className="text-sm opacity-80">
        <div>Proxy URL: <code>{proxyUrl}</code></div>
        <div>Origin URL: <code>{originUrl || '(not set)'}</code></div>
        <div>Anon present: <code>{String(!!anon)}</code></div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <input className="border rounded p-2" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="border rounded p-2" placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <button onClick={run} className="px-3 py-2 rounded bg-black text-white">Run proxy vs origin</button>
        <button onClick={testRealtime} className="px-3 py-2 rounded bg-black text-white">Test Realtime</button>
      </div>
      <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto h-64">{JSON.stringify(out, null, 2)}</pre>
      <p className="text-xs opacity-60">Пароль не логируется. Для прод — удалите страницу после аудита.</p>
    </div>
  );
}
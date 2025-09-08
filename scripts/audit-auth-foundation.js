#!/usr/bin/env node
/* Audit Supabase auth foundation: runtime, issuer check, storage, realtime, direct /auth usage, secrets leakage */
const fs = require('fs');
const path = require('path');
const glob = require('glob');

function read(file) { try { return fs.readFileSync(file, 'utf8'); } catch { return ''; } }
function exists(p) { try { fs.accessSync(p); return true; } catch { return false; } }

const files = glob.sync('**/*.{ts,tsx,js,jsx}', { ignore: ['node_modules/**','dist/**','build/**','.next/**'] });
const pkg = exists('package.json') ? JSON.parse(read('package.json')) : {};
const runtimeJs = exists('public/runtime-config.js');
const runtimeJson = exists('public/runtime-config.json');
const runtime = (runtimeJs || runtimeJson);

let findings = {
  runtimeUrl: false,
  runtimeAnon: false,
  supabaseClientReadsRuntime: false,
  domainCheckAntiPattern: [],
  issuerCheckOk: false,
  directAuthFetch: [],
  usesEnvAnonOnly: [],
  storageBulldozer: [],
  realtimeSetAuth: 0,
  serviceRoleLeaks: [],
  passwordLogs: [],
};

if (runtimeJs) {
  const s = read('public/runtime-config.js');
  findings.runtimeUrl = /SUPABASE_URL/.test(s);
  findings.runtimeAnon = /SUPABASE_ANON_KEY/.test(s);
}
if (runtimeJson && !findings.runtimeUrl) {
  const s = read('public/runtime-config.json');
  findings.runtimeUrl = /SUPABASE_URL/.test(s);
}

for (const f of files) {
  const s = read(f);

  // supabase client reads runtime?
  if (/createClient\(/.test(s) && /__PB_RUNTIME__|runtime-config|SUPABASE_URL/.test(s)) {
    findings.supabaseClientReadsRuntime = true;
  }

  // anti-pattern: comparing token domain to window/location/allowedDomains
  if (/isTokenFromCurrentDomain|allowedDomains|window\.location\.origin/.test(s) && /auth\/v1/.test(s)) {
    findings.domainCheckAntiPattern.push(f);
  }

  // issuer check
  if (/iss/.test(s) && /\/auth\/v1/.test(s) && /startsWith\(.+\/auth\/v1\)/.test(s)) {
    findings.issuerCheckOk = true;
  }

  // direct /auth fetch
  if (/fetch\(.+\/auth\/v1\/token/.test(s)) {
    findings.directAuthFetch.push(f);
  }

  // env anon only
  if (/VITE_SUPABASE_ANON_KEY/.test(s) && !/__PB_RUNTIME__|runtime-config|SUPABASE_ANON_KEY/.test(s)) {
    findings.usesEnvAnonOnly.push(f);
  }

  // bulldozer storage clear
  if (/localStorage|sessionStorage/.test(s) && /(auth|token|sb-).*(removeItem|clear)/i.test(s) && !/sb-\$\{ref\}|sb-[a-z0-9]{20}/i.test(s)) {
    findings.storageBulldozer.push(f);
  }

  // realtime.setAuth
  findings.realtimeSetAuth += (s.match(/realtime\.setAuth\(/g) || []).length;

  // sensitive
  if (/service[_-]?role/i.test(s) || /SUPABASE_SERVICE_ROLE/i.test(s)) {
    findings.serviceRoleLeaks.push(f);
  }
  if (/console\.(log|info|warn|error)\(.*password/i.test(s) || /password\s*:\s*[^*]/i.test(s)) {
    findings.passwordLogs.push(f);
  }
}

const issues = [];
if (!runtime) issues.push('❌ Нет public/runtime-config.(js|json) с SUPABASE_URL/ANON');
if (!findings.runtimeAnon) issues.push('❌ В runtime нет SUPABASE_ANON_KEY (или не читается)');
if (!findings.supabaseClientReadsRuntime) issues.push('❌ Клиент Supabase не читает URL/KEY из runtime');
if (findings.domainCheckAntiPattern.length) issues.push('❌ Найдена доменная проверка токена (isTokenFromCurrentDomain/allowedDomains): ' + findings.domainCheckAntiPattern.join(', '));
if (!findings.issuerCheckOk) issues.push('❌ Нет явной проверки issuer (iss.startsWith(<SUPABASE_URL>/auth/v1))');
if (findings.directAuthFetch.length) issues.push('⚠️ Есть прямые fetch к /auth/v1/token: ' + findings.directAuthFetch.join(', '));
if (findings.usesEnvAnonOnly.length) issues.push('⚠️ Anon key берётся только из env: ' + findings.usesEnvAnonOnly.join(', '));
if (findings.storageBulldozer.length) issues.push('⚠️ Бульдозерная очистка storage: ' + findings.storageBulldozer.join(', '));
if (findings.realtimeSetAuth === 0) issues.push('❌ Нет вызовов supabase.realtime.setAuth(access_token)');
if (findings.serviceRoleLeaks.length) issues.push('🚨 ВОЗМОЖНА утечка service_role в фронте: ' + findings.serviceRoleLeaks.join(', '));
if (findings.passwordLogs.length) issues.push('🚨 Найдены потенциальные логи пароля: ' + findings.passwordLogs.join(', '));

const summary = {
  ok: issues.length === 0,
  findings,
  issues,
};
console.log(JSON.stringify(summary, null, 2));
if (issues.length) process.exit(2);
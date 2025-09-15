// refreshMutex.ts
const LOCK_KEY = 'pb_refresh_lock_at';
const LOCK_TTL = 25_000; // мс
const bc = 'BroadcastChannel' in window ? new BroadcastChannel('pb-auth') : null;
let refreshing = false;

function hasValidLock() {
  const at = Number(localStorage.getItem(LOCK_KEY) || 0);
  return Date.now() - at < LOCK_TTL;
}
function setLock() { localStorage.setItem(LOCK_KEY, String(Date.now())); }
function clearLock() { localStorage.removeItem(LOCK_KEY); }

bc && (bc.onmessage = (e) => {
  if (e?.data === 'refresh-start') refreshing = true;
  if (e?.data === 'refresh-done') refreshing = false;
});

export async function refreshSessionOnce(supabase: any) {
  if (refreshing || hasValidLock()) return 'in-progress';
  refreshing = true; setLock(); bc?.postMessage('refresh-start');
  try {
    const { error } = await supabase.auth.refreshSession();
    return error ? 'error' : 'ok';
  } finally {
    clearLock(); refreshing = false; bc?.postMessage('refresh-done');
  }
}
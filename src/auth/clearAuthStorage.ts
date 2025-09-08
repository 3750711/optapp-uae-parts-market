import { getProjectRef, getProjectRefFromAnon } from './projectRef';

export function clearAuthStorageSafe(anonKey?: string) {
  const ref = anonKey ? getProjectRefFromAnon(anonKey) : getProjectRef();
  const prefixes = ref ? [`sb-${ref}-`, `supabase.auth.`] : [`sb-`, `supabase.auth.`];

  for (const storage of [localStorage, sessionStorage]) {
    for (const k of Object.keys(storage)) {
      if (prefixes.some(p => k.startsWith(p))) storage.removeItem(k);
    }
  }
}
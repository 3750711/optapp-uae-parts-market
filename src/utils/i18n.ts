import { Lang } from '@/types/i18n';

export const tPick = <T,>(dict: Record<Lang, T>, lang: Lang, fb: Lang = 'en'): T =>
  dict[lang] ?? dict[fb] ?? dict.ru;
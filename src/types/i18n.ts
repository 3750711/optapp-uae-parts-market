export type Lang = 'ru' | 'en' | 'bn';

export function pick<T>(dict: Record<Lang, T>, lang: Lang, fallback: Lang = 'en'): T {
  return dict[lang] ?? dict[fallback] ?? dict.ru;
}
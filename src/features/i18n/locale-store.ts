export type AppLocale = "en" | "ar";

export const LOCALE_STORAGE_KEY = "bookwise.locale";

export function isAppLocale(value: unknown): value is AppLocale {
  return value === "en" || value === "ar";
}

export function readStoredLocale(): AppLocale {
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isAppLocale(raw)) return raw;
  } catch {
    /* ignore */
  }
  return "en";
}

export function persistLocale(locale: AppLocale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
}

export function isRtlLocale(locale: AppLocale): boolean {
  return locale === "ar";
}

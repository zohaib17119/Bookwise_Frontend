import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";
import {
  isRtlLocale,
  persistLocale,
  readStoredLocale,
  type AppLocale
} from "./locale-store";
import {
  getNamespaceMessages,
  interpolate,
  type MessageNamespace
} from "./messages";

type I18nContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  isRtl: boolean;
  t: (ns: MessageNamespace, key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<AppLocale>(() => readStoredLocale());

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next);
    persistLocale(next);
  }, []);

  const t = useCallback(
    (ns: MessageNamespace, key: string, vars?: Record<string, string | number>) => {
      const dict = getNamespaceMessages(locale, ns);
      const fallback = getNamespaceMessages("en", ns);
      const template = dict[key] ?? fallback[key] ?? key;
      return interpolate(template, vars);
    },
    [locale]
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      isRtl: isRtlLocale(locale),
      t
    }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}

export function useLocale() {
  const { locale, setLocale, isRtl } = useI18n();
  return { locale, setLocale, isRtl };
}

/** Namespace-scoped translator, e.g. `const t = useT("pos")`. */
export function useT(ns: MessageNamespace) {
  const { t } = useI18n();
  return useCallback(
    (key: string, vars?: Record<string, string | number>) => t(ns, key, vars),
    [ns, t]
  );
}

import type { AppLocale } from "./locale-store";
import enPos from "@/locales/en/pos.json";
import arPos from "@/locales/ar/pos.json";

export type MessageNamespace = "pos";

type MessageDict = Record<string, string>;

const catalogs: Record<AppLocale, Record<MessageNamespace, MessageDict>> = {
  en: { pos: enPos },
  ar: { pos: arPos }
};

export function getNamespaceMessages(locale: AppLocale, ns: MessageNamespace): MessageDict {
  return catalogs[locale]?.[ns] ?? catalogs.en[ns] ?? {};
}

/** Replace `{{name}}` placeholders in a message string. */
export function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) =>
    vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : ""
  );
}

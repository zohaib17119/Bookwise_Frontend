import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type GuideLang = "en" | "ur";

type FbrSetupGuideProps = {
  whitelistIps: string[];
  irisPortalUrl?: string;
};

const copy = {
  en: {
    title: "How to turn on Digital Invoicing",
    intro:
      "Follow these steps once per company. Token and IP whitelist come from FBR IRIS — BooksWise does not create them for you.",
    ipTitle: "BooksWise server IP (whitelist in IRIS)",
    ipHelp:
      "This is the BooksWise server public IP — enter this on your IRIS IP Whitelisting form (not your home or office IP).",
    ipEmpty: "Contact BooksWise support for the whitelist IP.",
    copy: "Copy",
    copied: "Copied",
    steps: [
      "Open {portal}, log in with your NTN, then go to Digital Invoicing → API Integration → choose PRAL.",
      "In IRIS IP Whitelisting, submit the BooksWise server IP shown above (hosting company/country as applicable). Wait for PRAL approval (often within ~2 working hours).",
      "Open IRIS Sandbox Environment → View Web API / security token, and copy the Sandbox security token.",
      "On this page: set Environment = Sandbox, fill seller NTN/name/province/address and a sandbox scenario ID (e.g. SN001), paste the token, then Save.",
      "Click Test connection. It must show OK before you enable live submits.",
      "Tick Enable FBR Digital Invoicing and Save again.",
      "On Customers set FBR registration type + province (and NTN if Registered). On Items set HS code, FBR UoM, and sale type. Issue the invoice, then click Send to FBR on the invoice — BooksWise waits for FBR’s live response (success or error).",
      "Production later: after sandbox scenarios succeed in IRIS, paste the Production token, switch Environment to Production, Test connection, then Enable + Save. Do not use Production until sandbox works.",
    ],
  },
  ur: {
    title: "ڈیجیٹل انوائسنگ کیسے آن کریں",
    intro:
      "ہر کمپنی کے لیے یہ مراحل ایک بار مکمل کریں۔ ٹوکن اور IP وائٹ لسٹ FBR IRIS سے آتے ہیں — BooksWise انہیں آپ کے لیے نہیں بناتا۔",
    ipTitle: "BooksWise سرور IP (IRIS میں وائٹ لسٹ کریں)",
    ipHelp:
      "یہ BooksWise سرور کا پبلک IP ہے — اپنے IRIS IP Whitelisting فارم میں یہی درج کریں (گھر یا آفس کا IP نہیں)۔",
    ipEmpty: "وائٹ لسٹ IP کے لیے BooksWise سپورٹ سے رابطہ کریں۔",
    copy: "کاپی",
    copied: "کاپی ہو گیا",
    steps: [
      "{portal} کھولیں، اپنے NTN سے لاگ اِن کریں، پھر Digital Invoicing → API Integration → PRAL منتخب کریں۔",
      "IRIS میں IP Whitelisting پر اوپر دکھایا گیا BooksWise سرور IP جمع کرائیں (ہوسٹنگ کمپنی/ملک حسبِ ضرورت)۔ PRAL منظوری کا انتظار کریں (عام طور پر تقریباً ۲ کام کے دنوں میں)۔",
      "IRIS Sandbox Environment کھولیں → View Web API / سیکیورٹی ٹوکن، اور Sandbox سیکیورٹی ٹوکن کاپی کریں۔",
      "اس صفحے پر: Environment = Sandbox رکھیں، بیچنے والے کا NTN/نام/صوبہ/پتہ اور سینڈ باکس scenario ID (جیسے SN001) بھریں، ٹوکن پیسٹ کریں، پھر Save کریں۔",
      "Test connection دبائیں۔ لائیو سبمٹ آن کرنے سے پہلے یہ OK ہونا چاہیے۔",
      "Enable FBR Digital Invoicing چیک کریں اور دوبارہ Save کریں۔",
      "Customers پر FBR رجسٹریشن قسم + صوبہ (Registered ہو تو NTN بھی) سیٹ کریں۔ Items پر HS کوڈ، FBR UoM اور sale type سیٹ کریں۔ انوائس ایشو کریں، پھر Send to FBR دبائیں — BooksWise FBR کا لائیو جواب (کامیابی یا غلطی) کا انتظار کرتا ہے۔",
      "بعد میں Production: جب IRIS میں سینڈ باکس منظرنامے کامیاب ہوں، Production ٹوکن پیسٹ کریں، Environment کو Production کریں، Test connection چلائیں، پھر Enable + Save۔ جب تک سینڈ باکس کام نہ کرے Production استعمال نہ کریں۔",
    ],
  },
} as const;

export function FbrSetupGuide({ whitelistIps, irisPortalUrl }: FbrSetupGuideProps) {
  const portal = irisPortalUrl || "https://iris.fbr.gov.pk";
  const [lang, setLang] = useState<GuideLang>("en");
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const t = copy[lang];
  const isUrdu = lang === "ur";

  const copyIp = async (ip: string) => {
    try {
      await navigator.clipboard.writeText(ip);
      setCopiedIp(ip);
      window.setTimeout(() => setCopiedIp(null), 2000);
    } catch {
      setCopiedIp(null);
    }
  };

  const renderStep = (template: string) => {
    const parts = template.split("{portal}");
    if (parts.length === 1) return template;
    return (
      <>
        {parts[0]}
        <a className="text-primary underline" href={portal} rel="noreferrer" target="_blank">
          {portal}
        </a>
        {parts[1]}
      </>
    );
  };

  return (
    <div className="surface space-y-5 p-6" dir={isUrdu ? "rtl" : "ltr"} lang={lang}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">{t.title}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{t.intro}</p>
        </div>
        <div
          aria-label="Guide language"
          className="inline-flex shrink-0 rounded-lg border border-border/70 bg-white p-0.5 text-xs"
          dir="ltr"
          role="group"
        >
          <button
            className={cn(
              "rounded-md px-2.5 py-1.5 font-medium transition-colors",
              lang === "en"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setLang("en")}
            type="button"
          >
            English
          </button>
          <button
            className={cn(
              "rounded-md px-2.5 py-1.5 font-medium transition-colors",
              lang === "ur"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setLang("ur")}
            type="button"
          >
            اردو
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border/70 bg-white px-4 py-3">
        <p className="text-sm font-medium">{t.ipTitle}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t.ipHelp}</p>
        {whitelistIps.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{t.ipEmpty}</p>
        ) : (
          <ul className="mt-3 space-y-2" dir="ltr">
            {whitelistIps.map((ip) => (
              <li className="flex flex-wrap items-center gap-2" key={ip}>
                <code className="rounded-md bg-secondary px-2.5 py-1.5 font-mono text-sm">{ip}</code>
                <Button onClick={() => void copyIp(ip)} type="button" variant="secondary">
                  {copiedIp === ip ? t.copied : t.copy}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ol className="list-decimal space-y-3 pe-0 ps-5 text-sm">
        {t.steps.map((step) => (
          <li key={step}>{renderStep(step)}</li>
        ))}
      </ol>
    </div>
  );
}

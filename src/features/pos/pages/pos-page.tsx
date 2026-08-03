import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useParams } from "react-router-dom";
import { apiClient } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/error";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { FormField } from "@/components/shared/form-field";
import { useCompany } from "@/features/companies/hooks/use-company";
import { useCreateCustomer, useCustomerOptions } from "@/features/customers/hooks/use-customers";
import { useItemOptions, useLookupItemByCode } from "@/features/items/hooks/use-items";
import type { Item } from "@/features/items/types/item.types";
import { useLocale, useT } from "@/features/i18n";
import { useTaxRates } from "@/features/tax/hooks/use-tax";

const WALK_IN_NAME = "Walk-in Customer";

type CartLine = {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  taxRateId?: string;
};

type LiveTaxBucket = {
  key: string;
  label: string;
  rate: number;
  taxableAmount: number;
  taxAmount: number;
  isExempt: boolean;
  isZeroRated: boolean;
};

type PosCheckoutResult = {
  invoice: {
    id: string;
    invoiceNumber?: string | null;
    qrPayload?: string | null;
    complianceStatus?: string | null;
  };
  receipt: { html: string; format: string };
};

function money(n: number) {
  return n.toFixed(2);
}

function lineAmount(line: CartLine) {
  return line.quantity * line.unitPrice;
}

export function PosPage() {
  const { companyId = "" } = useParams();
  const { locale, isRtl } = useLocale();
  const t = useT("pos");
  const barcodeRef = useRef<HTMLInputElement>(null);

  const [customerId, setCustomerId] = useState("");
  const [walkInReady, setWalkInReady] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState("1");
  const [barcode, setBarcode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [receiptHtml, setReceiptHtml] = useState<string | null>(null);
  const [lastInvoice, setLastInvoice] = useState<PosCheckoutResult["invoice"] | null>(null);
  const [pending, setPending] = useState(false);

  const customersQuery = useCustomerOptions(companyId || undefined);
  const itemsQuery = useItemOptions(companyId || undefined);
  const taxRatesQuery = useTaxRates(companyId || undefined);
  const companyQuery = useCompany(companyId || undefined);
  const createCustomer = useCreateCustomer(companyId || undefined);
  const lookupItem = useLookupItemByCode(companyId || undefined);

  const taxRates = useMemo(() => {
    const list = taxRatesQuery.data;
    return Array.isArray(list) ? list : [];
  }, [taxRatesQuery.data]);

  const taxLabel =
    companyQuery.data?.taxLabel?.trim() ||
    (companyQuery.data?.countryCode?.toUpperCase() === "SA"
      ? t("vat")
      : companyQuery.data?.countryCode?.toUpperCase() === "PK"
        ? t("salesTax")
        : t("tax"));

  const customers = useMemo(() => {
    const list = customersQuery.data;
    return Array.isArray(list) ? list : [];
  }, [customersQuery.data]);

  const items = useMemo(() => {
    const list = itemsQuery.data;
    return Array.isArray(list) ? list : [];
  }, [itemsQuery.data]);

  const selectedItem = items.find((item) => item.id === itemId);
  const hasZatcaQr = Boolean(lastInvoice?.qrPayload);
  const listsLoading = customersQuery.isLoading || itemsQuery.isLoading;
  const listsError = customersQuery.error || itemsQuery.error;

  const subtotal = useMemo(
    () => cart.reduce((sum, line) => sum + lineAmount(line), 0),
    [cart],
  );

  const liveTax = useMemo(() => {
    const rateById = new Map(taxRates.map((r) => [r.id, r]));
    const hasAnyRate = cart.some((line) => line.taxRateId && rateById.has(line.taxRateId));
    if (!hasAnyRate) {
      return { buckets: [] as LiveTaxBucket[], totalTax: 0, grandTotal: subtotal, hasRates: false };
    }

    const map = new Map<string, LiveTaxBucket>();
    let totalTax = 0;

    for (const line of cart) {
      const taxable = lineAmount(line);
      const rateRow = line.taxRateId ? rateById.get(line.taxRateId) : undefined;
      const rate = rateRow ? Number(rateRow.ratePercent) || 0 : 0;
      const name = (rateRow?.name || "").trim();
      const exempt = /\bEXEMPT\b/i.test(name);
      const zeroRated = !exempt && rate === 0 && !!line.taxRateId;
      const taxAmount = exempt || zeroRated ? 0 : (taxable * rate) / 100;
      totalTax += taxAmount;
      const key = line.taxRateId || (exempt ? "EXEMPT" : `RATE_${rate}`);
      const label = name || (exempt ? t("exempt") : zeroRated ? t("zeroRated") : `${rate}%`);
      const existing = map.get(key);
      if (existing) {
        existing.taxableAmount += taxable;
        existing.taxAmount += taxAmount;
      } else {
        map.set(key, {
          key,
          label,
          rate,
          taxableAmount: taxable,
          taxAmount,
          isExempt: exempt,
          isZeroRated: zeroRated,
        });
      }
    }

    return {
      buckets: Array.from(map.values()).sort((a, b) => b.rate - a.rate || a.label.localeCompare(b.label)),
      totalTax,
      grandTotal: subtotal + totalTax,
      hasRates: true,
    };
  }, [cart, subtotal, t, taxRates]);

  // Find or create Walk-in Customer once options load
  useEffect(() => {
    if (!companyId || customersQuery.isLoading || walkInReady) return;

    const existing = customers.find(
      (c) => (c.displayName || "").trim().toLowerCase() === WALK_IN_NAME.toLowerCase(),
    );
    if (existing) {
      setCustomerId((prev) => prev || existing.id);
      setWalkInReady(true);
      return;
    }

    if (createCustomer.isPending) return;

    let cancelled = false;
    createCustomer
      .mutateAsync({ displayName: WALK_IN_NAME, isActive: true })
      .then((created) => {
        if (cancelled) return;
        setCustomerId(created.id);
        setWalkInReady(true);
      })
      .catch((err) => {
        if (cancelled) return;
        // Race: another tab created it — refetch and pick
        void customersQuery.refetch().then((res) => {
          const list = Array.isArray(res.data) ? res.data : [];
          const found = list.find(
            (c) => (c.displayName || "").trim().toLowerCase() === WALK_IN_NAME.toLowerCase(),
          );
          if (found) {
            setCustomerId(found.id);
            setWalkInReady(true);
          } else {
            setError(err instanceof Error ? err.message : t("checkoutFailed"));
            setWalkInReady(true);
          }
        });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run when customer list settles
  }, [companyId, customersQuery.isLoading, customers, walkInReady]);

  useEffect(() => {
    barcodeRef.current?.focus();
  }, [cart.length]);

  const addOrBumpFromItem = useCallback((item: Item, addQty = 1) => {
    const unitPrice = Number(item.salesPrice ?? 0) || 0;
    const bump = Math.max(1, addQty);
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.itemId === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + bump };
        return next;
      }
      return [
        ...prev,
        {
          itemId: item.id,
          itemName: item.name,
          quantity: bump,
          unitPrice,
          taxRateId: item.taxRateId || undefined,
        },
      ];
    });
    setReceiptHtml(null);
    setLastInvoice(null);
    setScanError(null);
    setError(null);
  }, []);

  const onManualAdd = () => {
    if (!selectedItem) {
      setError(t("selectItem"));
      return;
    }
    const n = Number(qty);
    if (!Number.isFinite(n) || n <= 0) {
      setError(t("quantity"));
      return;
    }
    addOrBumpFromItem(selectedItem, n);
    setItemId("");
    setQty("1");
    barcodeRef.current?.focus();
  };

  const onBarcodeSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    const code = barcode.trim();
    if (!code || !companyId) return;
    setScanError(null);
    try {
      const item = await lookupItem.mutateAsync(code);
      addOrBumpFromItem(item, 1);
      setBarcode("");
      barcodeRef.current?.focus();
    } catch {
      setScanError(t("unknownBarcode"));
    }
  };

  const removeLine = (itemIdToRemove: string) => {
    setCart((prev) => prev.filter((l) => l.itemId !== itemIdToRemove));
  };

  const setLineQty = (itemIdToUpdate: string, nextQty: string) => {
    const n = Number(nextQty);
    setCart((prev) =>
      prev
        .map((l) =>
          l.itemId === itemIdToUpdate
            ? { ...l, quantity: Number.isFinite(n) && n > 0 ? n : l.quantity }
            : l,
        )
        .filter((l) => l.quantity > 0),
    );
  };

  const resetSale = () => {
    setCart([]);
    setItemId("");
    setQty("1");
    setBarcode("");
    setReceiptHtml(null);
    setLastInvoice(null);
    setError(null);
    setScanError(null);
    barcodeRef.current?.focus();
  };

  const onProceedToPay = async () => {
    setError(null);
    setReceiptHtml(null);
    setLastInvoice(null);
    if (!customerId) {
      setError(t("selectCustomerAndItem"));
      return;
    }
    if (cart.length === 0) {
      setError(t("emptyCart"));
      return;
    }
    setPending(true);
    try {
      const { data: result } = await apiClient.post<PosCheckoutResult>(
        `/companies/${companyId}/pos/invoices`,
        {
          customerId,
          sendImmediately: true,
          printFormat: "t80",
          locale,
          lines: cart.map((line) => ({
            itemId: line.itemId,
            itemName: line.itemName,
            description: line.itemName,
            quantity: Number.isInteger(line.quantity)
              ? String(line.quantity)
              : money(line.quantity),
            unitPrice: money(line.unitPrice),
            ...(line.taxRateId ? { taxRateId: line.taxRateId } : {}),
          })),
        },
      );
      setReceiptHtml(result.receipt.html);
      setLastInvoice(result.invoice);
      setCart([]);
    } catch (err) {
      setError(getApiErrorMessage(err, t("checkoutFailed")));
    } finally {
      setPending(false);
    }
  };

  const onPrint = () => {
    if (!receiptHtml) return;
    const popup = window.open("", "_blank", "width=420,height=640");
    if (!popup) {
      setError(t("popupBlocked"));
      return;
    }
    popup.document.write(receiptHtml);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  return (
    <div className="space-y-6" dir={isRtl ? "rtl" : "ltr"} lang={locale}>
      <PageHeader title={t("title")} description={t("description")} />

      {listsError ? (
        <Alert
          variant="destructive"
          title={t("loadErrorTitle")}
          description={
            listsError instanceof Error ? listsError.message : t("loadErrorDescription")
          }
        />
      ) : null}
      {error ? <Alert variant="destructive" title={error} /> : null}
      {scanError ? <Alert variant="destructive" title={scanError} /> : null}
      {lastInvoice ? (
        <Alert
          variant="success"
          title={t("issuedTitle", {
            number: lastInvoice.invoiceNumber || t("invoiceFallback"),
          })}
          description={hasZatcaQr ? t("issuedWithQr") : t("issuedWithoutQr")}
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: scan + add + cart edit */}
        <div className="surface space-y-4 p-6">
          <FormField label={t("customer")}>
            <select
              className="flex h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={customerId}
              disabled={listsLoading}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">{listsLoading ? t("loading") : t("selectCustomer")}</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.displayName || customer.legalName || customer.id}
                </option>
              ))}
            </select>
          </FormField>

          <form onSubmit={(e) => void onBarcodeSubmit(e)} className="space-y-2">
            <FormField label={t("barcode")}>
              <Input
                ref={barcodeRef}
                value={barcode}
                onChange={(e) => {
                  setBarcode(e.target.value);
                  setScanError(null);
                }}
                placeholder={t("barcodePlaceholder")}
                autoComplete="off"
                className="min-w-0 font-mono"
                disabled={listsLoading || lookupItem.isPending}
              />
            </FormField>
            <Button
              type="submit"
              variant="secondary"
              disabled={!barcode.trim() || lookupItem.isPending}
              isLoading={lookupItem.isPending}
            >
              {lookupItem.isPending ? t("scanning") : t("add")}
            </Button>
          </form>

          <div className="border-t border-border/60 pt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label={t("item")}>
                <select
                  className="flex h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={itemId}
                  disabled={listsLoading}
                  onChange={(e) => setItemId(e.target.value)}
                >
                  <option value="">{listsLoading ? t("loading") : t("selectItem")}</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                      {item.sku ? ` (${item.sku})` : ""}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label={t("quantity")}>
                <Input
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="min-w-0"
                  inputMode="decimal"
                />
              </FormField>
            </div>
            <div className="mt-3">
              <Button
                type="button"
                disabled={listsLoading || !itemId}
                onClick={onManualAdd}
              >
                {t("add")}
              </Button>
            </div>
          </div>

          {cart.length > 0 ? (
            <div className="space-y-2 border-t border-border/60 pt-4">
              <p className="text-sm font-medium">{t("cart")}</p>
              <ul className="space-y-2">
                {cart.map((line) => (
                  <li
                    key={line.itemId}
                    className="flex flex-wrap items-center gap-2 rounded-md border border-border/60 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 flex-1 font-medium">{line.itemName}</span>
                    <Input
                      className="h-8 w-20"
                      value={String(line.quantity)}
                      onChange={(e) => setLineQty(line.itemId, e.target.value)}
                      inputMode="decimal"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLine(line.itemId)}
                    >
                      {t("remove")}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
            <Button
              type="button"
              isLoading={pending}
              disabled={listsLoading || cart.length === 0 || !customerId}
              onClick={() => void onProceedToPay()}
            >
              {t("proceedToPay")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={!receiptHtml}
              onClick={onPrint}
            >
              {t("printReceipt")}
            </Button>
            <Button type="button" variant="ghost" onClick={resetSale}>
              {t("newSale")}
            </Button>
          </div>
        </div>

        {/* Right: live receipt (screen) + printed thermal after pay */}
        <div className="surface space-y-4 p-6">
          <p className="text-sm font-semibold">{t("liveReceipt")}</p>
          <div className="overflow-x-auto rounded-md border border-border/70">
            <table className="w-full min-w-[20rem] text-sm">
              <thead>
                <tr className="border-b border-border/70 bg-muted/40 text-start">
                  <th className="px-3 py-2 font-medium">{t("item")}</th>
                  <th className="px-3 py-2 text-end font-medium">{t("quantity")}</th>
                  <th className="px-3 py-2 text-end font-medium">{t("rate")}</th>
                  <th className="px-3 py-2 text-end font-medium">{t("amount")}</th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                      {t("cartEmptyHint")}
                    </td>
                  </tr>
                ) : (
                  cart.map((line) => (
                    <tr key={line.itemId} className="border-b border-border/50">
                      <td className="px-3 py-2">{line.itemName}</td>
                      <td className="px-3 py-2 text-end tabular-nums">{line.quantity}</td>
                      <td className="px-3 py-2 text-end tabular-nums">{money(line.unitPrice)}</td>
                      <td className="px-3 py-2 text-end tabular-nums">{money(lineAmount(line))}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="px-3 py-2 text-end font-medium">
                    {t("subtotal")}
                  </td>
                  <td className="px-3 py-2 text-end font-semibold tabular-nums">
                    {money(subtotal)}
                  </td>
                </tr>
                {liveTax.hasRates
                  ? liveTax.buckets.map((bucket) => (
                      <Fragment key={bucket.key}>
                        <tr>
                          <td
                            colSpan={4}
                            className="px-3 pt-2 text-end text-xs text-muted-foreground"
                          >
                            {bucket.isExempt
                              ? `${t("exempt")}${bucket.label ? ` (${bucket.label})` : ""}`
                              : bucket.isZeroRated
                                ? `${t("zeroRated")}${bucket.label ? ` (${bucket.label})` : ""}`
                                : bucket.label}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="px-3 py-1 text-end text-muted-foreground">
                            {t("taxable")}
                          </td>
                          <td className="px-3 py-1 text-end tabular-nums text-muted-foreground">
                            {money(bucket.taxableAmount)}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="px-3 py-1 text-end text-muted-foreground">
                            {taxLabel}
                            {bucket.rate > 0 ? ` ${bucket.rate}%` : ""}
                          </td>
                          <td className="px-3 py-1 text-end tabular-nums text-muted-foreground">
                            {money(bucket.taxAmount)}
                          </td>
                        </tr>
                      </Fragment>
                    ))
                  : null}
                {liveTax.hasRates ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-end font-medium">
                      {t("totalTax", { taxLabel })}
                    </td>
                    <td className="px-3 py-2 text-end font-semibold tabular-nums">
                      {money(liveTax.totalTax)}
                    </td>
                  </tr>
                ) : null}
                <tr>
                  <td colSpan={3} className="px-3 py-2 text-end font-medium">
                    {t("total")}
                  </td>
                  <td className="px-3 py-2 text-end text-base font-bold tabular-nums">
                    {money(liveTax.hasRates ? liveTax.grandTotal : subtotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {receiptHtml ? (
            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                {t("receiptPreview")}
              </p>
              <iframe
                title={t("receiptPreview")}
                srcDoc={receiptHtml}
                className="h-[22rem] w-full max-w-full rounded-md border border-border/70 bg-white"
                sandbox="allow-same-origin"
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

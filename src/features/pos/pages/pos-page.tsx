import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { FormField } from "@/components/shared/form-field";

type Customer = { id: string; displayName?: string | null; legalName?: string | null };
type Item = { id: string; name: string; salesPrice?: string | number | null };

export function PosPage() {
  const { companyId = "" } = useParams();
  const [customerId, setCustomerId] = useState("");
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [receiptHtml, setReceiptHtml] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const customersQuery = useQuery({
    queryKey: ["companies", companyId, "customers", "pos"],
    queryFn: () => apiClient.get<{ data?: Customer[] } | Customer[]>(`/companies/${companyId}/customers`),
    enabled: Boolean(companyId),
  });

  const itemsQuery = useQuery({
    queryKey: ["companies", companyId, "items", "pos"],
    queryFn: () => apiClient.get<{ data?: Item[] } | Item[]>(`/companies/${companyId}/items`),
    enabled: Boolean(companyId),
  });

  const customers = useMemo(() => {
    const raw = customersQuery.data as any;
    return (raw?.data ?? raw?.items ?? raw ?? []) as Customer[];
  }, [customersQuery.data]);

  const items = useMemo(() => {
    const raw = itemsQuery.data as any;
    return (raw?.data ?? raw?.items ?? raw ?? []) as Item[];
  }, [itemsQuery.data]);

  const selectedItem = items.find((item) => item.id === itemId);

  const onCheckout = async () => {
    setError(null);
    setReceiptHtml(null);
    if (!customerId || !selectedItem) {
      setError("Select a customer and item");
      return;
    }
    setPending(true);
    try {
      const { data: result } = await apiClient.post<{
        invoice: { id: string; invoiceNumber: string };
        receipt: { html: string; format: string };
      }>(`/companies/${companyId}/pos/invoices`, {
        customerId,
        sendImmediately: true,
        printFormat: "t80",
        lines: [
          {
            itemId: selectedItem.id,
            itemName: selectedItem.name,
            description: selectedItem.name,
            quantity: qty,
            unitPrice: String(selectedItem.salesPrice ?? "0"),
          },
        ],
      });
      setReceiptHtml(result.receipt.html);
    } catch (err) {
      setError(err instanceof Error ? err.message : "POS checkout failed");
    } finally {
      setPending(false);
    }
  };

  const onPrint = () => {
    if (!receiptHtml) return;
    const popup = window.open("", "_blank", "width=420,height=640");
    if (!popup) return;
    popup.document.write(receiptHtml);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="POS" description="Quick sale using the same invoice engine. Prints a thermal receipt." />
      {error ? <Alert variant="destructive" title={error} /> : null}
      <div className="surface grid max-w-3xl gap-4 p-6 md:grid-cols-2">
        <FormField label="Customer">
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          >
            <option value="">Select customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.displayName || customer.legalName || customer.id}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Item">
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
          >
            <option value="">Select item</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Quantity">
          <Input value={qty} onChange={(e) => setQty(e.target.value)} />
        </FormField>
        <div className="flex items-end gap-2">
          <Button type="button" isLoading={pending} onClick={() => void onCheckout()}>
            Charge & issue
          </Button>
          <Button type="button" variant="secondary" disabled={!receiptHtml} onClick={onPrint}>
            Print preview
          </Button>
        </div>
      </div>
      {receiptHtml ? (
        <div className="surface max-w-md overflow-auto p-4">
          <div dangerouslySetInnerHTML={{ __html: receiptHtml }} />
        </div>
      ) : null}
    </div>
  );
}

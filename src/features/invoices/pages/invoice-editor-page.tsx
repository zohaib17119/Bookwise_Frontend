import { useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CounterpartySelect } from "@/components/documents/counterparty-select";
import { formatCurrency } from "@/lib/utils/format";

export default function InvoiceEditorPage({
  company,
  form,
  customersQuery,
  itemsQuery,
  taxCodesQuery,
  taxRatesQuery,
  onSubmit,
  isLoading,
  mode,
  companyId,
}: {
  company: any;
  form: any;
  customersQuery: any;
  itemsQuery?: any;
  taxCodesQuery?: any;
  taxRatesQuery?: any;
  onSubmit: () => void;
  isLoading: boolean;
  mode: "create" | "edit";
  companyId: string;
}) {
  const watchedCustomerId = form.watch("customerId");
  const watchedLines = form.watch("lines") || [];
  const watchedTerms = form.watch("terms");
  const watchedIssueDate = form.watch("issueDate");
  const watchedDiscountType = form.watch("discountType");
  const watchedDiscountValue = form.watch("discountValue");

  // Get item details by ID
  const getItemById = useCallback((itemId: string) => {
    return itemsQuery?.data?.find((item: any) => item.id === itemId);
  }, [itemsQuery?.data]);

  // Get tax code details by ID
  const getTaxCodeById = useCallback((taxCodeId: string) => {
    return taxCodesQuery?.data?.find((tc: any) => tc.id === taxCodeId);
  }, [taxCodesQuery?.data]);

  // Calculate effective tax rate from tax rate ID
  const getTaxRateFromCode = useCallback((taxRateId: string) => {
    const taxRate = taxRatesQuery?.data?.find((tr: any) => tr.id === taxRateId);
    if (taxRate) {
      return Number(taxRate.ratePercent || 0);
    }
    return 0;
  }, [taxRatesQuery?.data]);

  // Handle item selection - auto-populate rate, description, and tax
  const handleItemChange = (index: number, itemId: string) => {
    if (itemId === "__service__") {
      // Manual service entry - clear itemId but allow manual rate entry
      form.setValue(`lines.${index}.itemId`, "");
      form.setValue(`lines.${index}.description`, "");
      form.setValue(`lines.${index}.unitPrice`, "");
      form.setValue(`lines.${index}.taxRateId`, "");
      return;
    }
    
    const item = getItemById(itemId);
    
    if (item) {
      // Auto-populate from item
      form.setValue(`lines.${index}.itemId`, itemId);
      form.setValue(`lines.${index}.description`, item.description || item.name);
      form.setValue(`lines.${index}.unitPrice`, item.salesPrice || "");
      
      // If item has tax rate, auto-populate tax
      if (item.taxRateId) {
        form.setValue(`lines.${index}.taxRateId`, item.taxRateId);
      } else {
        form.setValue(`lines.${index}.taxRateId`, "");
      }
    } else {
      // Clear fields if no item selected
      form.setValue(`lines.${index}.itemId`, itemId);
    }
  };

  // Calculate totals with proper tax calculation
  const totals = useMemo(() => {
    let subtotal = 0;
    let totalTax = 0;

    watchedLines.forEach((line: any) => {
      const qty = Number(line.quantity) || 0;
      const rate = Number(line.unitPrice) || 0;
      const lineAmount = qty * rate;
      subtotal += lineAmount;

      // Get tax rate from tax rate ID
      let taxRate = 0;
      if (line.taxRateId) {
        taxRate = getTaxRateFromCode(line.taxRateId);
      } else if (line.taxRate) {
        taxRate = Number(line.taxRate);
      }
      
      totalTax += lineAmount * (taxRate / 100);
    });

    // Apply discount on subtotal
    let discountAmount = 0;
    if (watchedDiscountType === "PERCENTAGE") {
      discountAmount = subtotal * (Number(watchedDiscountValue) || 0) / 100;
    } else if (watchedDiscountType === "FIXED") {
      discountAmount = Number(watchedDiscountValue) || 0;
    }

    const total = subtotal - discountAmount + totalTax;

    return {
      subtotal: subtotal.toFixed(2),
      discount: discountAmount.toFixed(2),
      tax: totalTax.toFixed(2),
      total: total.toFixed(2),
    };
  }, [watchedLines, watchedDiscountType, watchedDiscountValue, getTaxRateFromCode]);

  // Auto-calculate due date when terms or issue date changes
  useEffect(() => {
    if (watchedTerms && watchedIssueDate) {
      const days = parseInt(watchedTerms);
      if (!isNaN(days)) {
        const issueDate = new Date(watchedIssueDate);
        issueDate.setDate(issueDate.getDate() + days);
        form.setValue("dueDate", issueDate.toISOString().split("T")[0]);
      }
    }
  }, [watchedTerms, watchedIssueDate, form]);

  const selectedCustomer = customersQuery.data?.find(
    (c: any) => c.id === watchedCustomerId
  );

  const addLine = () => {
    const currentLines = form.getValues("lines") || [];
    form.setValue("lines", [
      ...currentLines,
      {
        itemId: "",
        description: "",
        quantity: 1,
        unitPrice: "",
        discountType: undefined,
        discountValue: "",
        taxCodeId: "",
        taxRate: "",
      },
    ]);
  };

  const removeLine = (index: number) => {
    const currentLines = form.getValues("lines");
    form.setValue(
      "lines",
      currentLines.filter((_: any, i: number) => i !== index)
    );
  };

  const clearLines = () => {
    form.setValue("lines", [
      {
        itemId: "",
        description: "",
        quantity: 1,
        unitPrice: "",
        discountType: undefined,
        discountValue: "",
        taxCodeId: "",
        taxRate: "",
      },
    ]);
  };

  const currency = form.watch("currencyCode") || company?.currency || "USD";

  // Group items by type for better UX
  const inventoryItems = itemsQuery?.data?.filter((item: any) => item.type === "inventory") || [];
  const nonInventoryItems = itemsQuery?.data?.filter((item: any) => item.type === "non_inventory") || [];
  const serviceItems = itemsQuery?.data?.filter((item: any) => item.type === "service") || [];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl bg-white shadow">
        {/* Header */}
        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                to={`/app/company/${companyId}/invoices`}
                className="mb-2 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Invoices
              </Link>
              <h1 className="text-4xl font-bold text-blue-600">INVOICE</h1>
            </div>
            <div className="text-right">
              <div className="mb-2 text-lg">
                <span className="text-gray-500">Balance Due: </span>
                <strong>{formatCurrency(Number(totals.total), currency)}</strong>
              </div>
              <div className="h-20 w-20 rounded bg-gray-200 ml-auto" />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold">{company?.name}</h3>
              <p>{company?.addressLine1}</p>
              <p>{company?.addressLine2}</p>
              <p>{company?.city}</p>
            </div>

            <div>
              <p>{company?.email}</p>
              <p>{company?.phone}</p>
            </div>

            <div></div>
          </div>
        </div>

        {/* Customer + Invoice Meta */}
        <div className="bg-slate-100 p-6">
          <div className="grid grid-cols-2 gap-10">
            <div>
              <CounterpartySelect
                error={form.formState.errors.customerId?.message}
                label="Customer"
                onChange={(value) => form.setValue("customerId", value)}
                options={(customersQuery.data ?? []).map((customer: any) => ({
                  id: customer.id,
                  label: customer.displayName,
                  secondary: customer.customerCode ?? undefined,
                }))}
                placeholder="Add Customer"
                value={watchedCustomerId}
              />
              {selectedCustomer && (
                <div className="mt-3 space-y-1 text-sm text-gray-600">
                  <p>{selectedCustomer.legalName}</p>
                  <p>{selectedCustomer.billingAddressLine1}</p>
                  <p>
                    {selectedCustomer.billingCity}
                    {selectedCustomer.billingCountry
                      ? `, ${selectedCustomer.billingCountry}`
                      : ""}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <label className="text-sm font-medium">Invoice No</label>
                <Input
                  {...form.register("invoiceNumber")}
                  placeholder="Auto-generated"
                  className="border p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="text-sm font-medium">Terms</label>
                <Select
                  {...form.register("terms")}
                  className="border p-2"
                >
                  <option value="0">Due on receipt</option>
                  <option value="15">Net 15</option>
                  <option value="30">Net 30</option>
                  <option value="45">Net 45</option>
                  <option value="60">Net 60</option>
                  <option value="90">Net 90</option>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="text-sm font-medium">Invoice Date</label>
                <Input
                  type="date"
                  {...form.register("issueDate")}
                  className="border p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="date"
                  {...form.register("dueDate")}
                  className="border p-2"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="p-6">
          <h2 className="mb-4 font-semibold">Products / Services</h2>

          <table className="w-full border">
            <thead>
              <tr className="bg-gray-50">
                <th className="border p-2 w-10">#</th>
                <th className="border p-2">Product / Service</th>
                <th className="border p-2">Description</th>
                <th className="border p-2 w-24">Qty</th>
                <th className="border p-2 w-32">Rate</th>
                <th className="border p-2 w-32">Tax</th>
                <th className="border p-2 w-32">Amount</th>
                <th className="border p-2 w-16"></th>
              </tr>
            </thead>

            <tbody>
              {watchedLines.map((line: any, index: number) => {
                const lineTaxRate = line.taxRateId ? getTaxRateFromCode(line.taxRateId) : Number(line.taxRate || 0);
                const lineAmount = (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0);
                const lineTaxAmount = lineAmount * (lineTaxRate / 100);
                
                return (
                <tr key={index}>
                  <td className="border p-2 text-center">{index + 1}</td>

                  <td className="border p-2">
                    <Select
                      value={line.itemId}
                      onChange={(e) => handleItemChange(index, e.target.value)}
                      className="w-full"
                    >
                      <option value="">Select Item</option>
                      {(itemsQuery?.data ?? []).map((item: any) => (
                        <option key={item.id} value={item.id}>
                          {item.name} {item.salesPrice ? ` - ${formatCurrency(Number(item.salesPrice), currency)}` : ""}
                        </option>
                      ))}
                      <option value="__service__">+ Add Service (Manual)</option>
                    </Select>
                  </td>

                  <td className="border p-2">
                    <Input
                      {...form.register(`lines.${index}.description`)}
                      className="w-full"
                      placeholder="Description"
                    />
                  </td>

                  <td className="border p-2">
                    <Input
                      type="number"
                      {...form.register(`lines.${index}.quantity`)}
                      className="w-full"
                      min="1"
                    />
                  </td>

                  <td className="border p-2">
                    <Input
                      type="number"
                      {...form.register(`lines.${index}.unitPrice`)}
                      className="w-full"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                    />
                  </td>

                  <td className="border p-2">
                    <Select
                      {...form.register(`lines.${index}.taxRateId`)}
                      className="w-full"
                    >
                      <option value="">No Tax</option>
                      {(taxRatesQuery?.data ?? []).map((taxRate: any) => (
                        <option key={taxRate.id} value={taxRate.id}>
                          {taxRate.name} ({taxRate.ratePercent}%)
                        </option>
                      ))}
                    </Select>
                  </td>

                  <td className="border p-2 text-right font-medium">
                    {formatCurrency(lineAmount + lineTaxAmount, currency)}
                  </td>

                  <td className="border p-2">
                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      className="text-red-500 hover:text-red-700"
                      disabled={watchedLines.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>

          <div className="mt-4 flex gap-2">
            <Button type="button" onClick={addLine} variant="secondary" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Product / Service
            </Button>

            <Button type="button" onClick={clearLines} variant="ghost" size="sm">
              Clear All
            </Button>
          </div>
        </div>

        {/* Notes + Totals */}
        <div className="grid grid-cols-2 gap-10 p-6 border-t">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Customer Payment Options
              </label>
              <textarea
                {...form.register("notes")}
                rows={4}
                className="w-full border p-2"
                placeholder="Payment options for customer..."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Note To Customer
              </label>
              <textarea
                rows={4}
                className="w-full border p-2"
                placeholder="Notes to show on invoice..."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Memo On Statement
              </label>
              <textarea
                rows={4}
                className="w-full border p-2"
                placeholder="Memo for statement..."
              />
            </div>
          </div>

          <div>
            <div className="space-y-4 rounded border p-6">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(Number(totals.subtotal), currency)}</span>
              </div>

              <div className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <span>Discount:</span>
                  <Select
                    {...form.register("discountType")}
                    className="border p-1 w-24"
                  >
                    <option value="">None</option>
                    <option value="FIXED">Fixed</option>
                    <option value="PERCENTAGE">%</option>
                  </Select>
                  <Input
                    type="number"
                    {...form.register("discountValue")}
                    className="border p-1 w-20"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                  />
                </div>
                <span>-{formatCurrency(Number(totals.discount), currency)}</span>
              </div>

              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatCurrency(Number(totals.tax), currency)}</span>
              </div>

              <div className="flex justify-between text-xl font-bold border-t pt-4">
                <span>Invoice Total</span>
                <span>{formatCurrency(Number(totals.total), currency)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between border-t p-4">
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">
              Print / Download
            </Button>

            <Button variant="secondary" size="sm">
              Make Recurring
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={form.handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              Save
            </Button>

            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={form.handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : mode === "create" ? "Review & Send" : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
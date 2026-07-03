import { useItems } from "@/features/items/hooks/use-items";
import { FormSection } from "@/components/shared/form-section";

interface VendorLinkedItemsProps {
  companyId: string | undefined;
  vendorId: string | undefined;
}

export function VendorLinkedItems({ companyId, vendorId }: VendorLinkedItemsProps) {
  const itemsQuery = useItems(companyId, {
    preferredVendorId: vendorId,
    limit: 50,
  });

  if (!vendorId) return null;

  const items = itemsQuery.data ?? [];

  return (
    <FormSection
      description="Products and services that list this vendor as their preferred supplier."
      title="Items from this vendor"
    >
      {itemsQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading linked items...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No items use this vendor as preferred supplier.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {items.map((item) => (
            <li className="rounded-lg border border-border/60 px-3 py-2" key={item.id}>
              <span className="font-medium">{item.name}</span>
              {item.itemCode ? (
                <span className="ml-2 text-muted-foreground">({item.itemCode})</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </FormSection>
  );
}

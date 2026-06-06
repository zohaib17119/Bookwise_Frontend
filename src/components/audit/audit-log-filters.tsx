import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DateRangeToolbar } from "@/components/accounting/date-range-toolbar";
import { FilterBar } from "@/components/shared/filter-bar";

export interface AuditFilterValues {
  search: string;
  module: string;
  action: string;
  entityType: string;
  actorUserId: string;
  fromDate: string;
  toDate: string;
}

interface AuditLogFiltersProps {
  values: AuditFilterValues;
  onChange: (patch: Partial<AuditFilterValues>) => void;
}

export function AuditLogFilters({ values, onChange }: AuditLogFiltersProps) {
  return (
    <FilterBar>
      <Input
        onChange={(event) => onChange({ search: event.target.value })}
        placeholder="Search audit description or entity"
        value={values.search}
      />
      <Input
        onChange={(event) => onChange({ actorUserId: event.target.value })}
        placeholder="Actor user ID"
        value={values.actorUserId}
      />
      <Select
        className="min-w-[160px]"
        onChange={(event) => onChange({ module: event.target.value })}
        value={values.module}
      >
        <option value="">All modules</option>
        <option value="companies">Companies</option>
        <option value="invoices">Invoices</option>
        <option value="bills">Bills</option>
        <option value="journals">Journals</option>
        <option value="banking">Banking</option>
        <option value="inventory">Inventory</option>
      </Select>
      <Input
        onChange={(event) => onChange({ action: event.target.value })}
        placeholder="Action"
        value={values.action}
      />
      <Input
        onChange={(event) => onChange({ entityType: event.target.value })}
        placeholder="Entity type"
        value={values.entityType}
      />
      <DateRangeToolbar
        fromDate={values.fromDate}
        onFromDateChange={(value) => onChange({ fromDate: value })}
        onToDateChange={(value) => onChange({ toDate: value })}
        toDate={values.toDate}
      />
    </FilterBar>
  );
}

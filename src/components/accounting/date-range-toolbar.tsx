import { Input } from "@/components/ui/input";

interface DateRangeToolbarProps {
  fromDate: string;
  toDate: string;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
}

export function DateRangeToolbar({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
}: DateRangeToolbarProps) {
  return (
    <>
      <Input
        onChange={(event) => onFromDateChange(event.target.value)}
        type="date"
        value={fromDate}
      />
      <Input
        onChange={(event) => onToDateChange(event.target.value)}
        type="date"
        value={toDate}
      />
    </>
  );
}

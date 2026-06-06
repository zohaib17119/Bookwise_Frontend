export interface ReportFilterParams {
  fromDate?: string;
  toDate?: string;
  asOfDate?: string;
  accountId?: string;
  postedOnly?: boolean;
}

export interface ReportRow {
  label: string;
  value?: number | string | null;
  debit?: number | null;
  credit?: number | null;
  balance?: number | null;
  amount?: number | null;
  depth?: number;
  [key: string]: unknown;
}

export interface ReportSection {
  title: string;
  rows: ReportRow[];
}

export interface GenericReportResult {
  title?: string;
  currencyCode?: string | null;
  sections?: ReportSection[];
  rows?: ReportRow[];
  totals?: Record<string, number | string | null>;
  [key: string]: unknown;
}

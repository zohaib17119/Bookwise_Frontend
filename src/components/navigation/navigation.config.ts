import type { LucideIcon } from "lucide-react";
import {
  Archive,
  BadgeDollarSign,
  BookOpenText,
  Boxes,
  Building2,
  FileBarChart2,
  FileClock,
  FolderKanban,
  Landmark,
  LayoutDashboard,
  Receipt,
  ReceiptText,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";

export interface CompanyNavigationItem {
  label: string;
  segment: string;
  icon: LucideIcon;
  permissionKeys?: string[];
  disabled?: boolean;
}

export interface CompanyNavigationGroup {
  title: string;
  items: CompanyNavigationItem[];
}

export const workspaceNavigation = [
  {
    label: "Companies",
    to: "/app/companies",
    icon: Building2,
  },
] as const;

export const companyNavigationGroups: CompanyNavigationGroup[] = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        segment: "dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Sales",
    items: [
      {
        label: "Customers",
        segment: "customers",
        icon: Users,
        permissionKeys: ["customers.view", "customers.read", "customers.manage"],
      },
      {
        label: "Estimates",
        segment: "estimates",
        icon: FileClock,
        permissionKeys: ["estimates.view", "estimates.read", "estimates.manage"],
      },
      {
        label: "Invoices",
        segment: "invoices",
        icon: ReceiptText,
        permissionKeys: ["invoices.view", "invoices.read", "invoices.manage"],
      },
      {
        label: "Customer Payments",
        segment: "customer-payments",
        icon: BadgeDollarSign,
        permissionKeys: [
          "customer-payments.view",
          "customer-payments.read",
          "customer-payments.manage",
          "customer_payments.view",
          "customer_payments.read",
          "customer_payments.manage",
        ],
      },
    ],
  },
  {
    title: "Purchases",
    items: [
      {
        label: "Vendors",
        segment: "vendors",
        icon: Building2,
        permissionKeys: ["vendors.view", "vendors.read", "vendors.manage"],
      },
      {
        label: "Bills",
        segment: "bills",
        icon: Receipt,
        permissionKeys: ["bills.view", "bills.read", "bills.manage"],
      },
      {
        label: "Bill Payments",
        segment: "bill-payments",
        icon: Wallet,
        permissionKeys: [
          "bill-payments.view",
          "bill-payments.read",
          "bill-payments.manage",
          "bill_payments.view",
          "bill_payments.read",
          "bill_payments.manage",
        ],
      },
    ],
  },
  {
    title: "Accounting",
    items: [
      {
        label: "Chart of Accounts",
        segment: "accounts",
        icon: BookOpenText,
        permissionKeys: ["accounts.view", "accounts.read", "accounts.manage"],
      },
      {
        label: "Journal Entries",
        segment: "journals",
        icon: Archive,
        permissionKeys: ["journals.view", "journals.read", "journals.manage"],
      },
      {
        label: "Reports",
        segment: "reports",
        icon: FileBarChart2,
        permissionKeys: ["reports.view", "reports.read", "reports.manage"],
      },
      {
        label: "Tax",
        segment: "tax",
        icon: Landmark,
        permissionKeys: ["tax.view", "tax.read", "tax.manage"],
      },
    ],
  },
  {
    title: "Banking",
    items: [
      {
        label: "Banking",
        segment: "banking",
        icon: Landmark,
        permissionKeys: ["banking.view", "banking.read", "banking.manage"],
      },
    ],
  },
  {
    title: "Inventory",
    items: [
      {
        label: "Items",
        segment: "items",
        icon: FolderKanban,
        permissionKeys: ["items.view", "items.read", "items.manage"],
      },
      {
        label: "Inventory",
        segment: "inventory",
        icon: Boxes,
        permissionKeys: ["inventory.view", "inventory.read", "inventory.manage"],
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        label: "Audit Logs",
        segment: "audit",
        icon: ShieldCheck,
        permissionKeys: ["audit_logs.view", "audit.read", "audit.manage"],
      },
      {
        label: "Settings",
        segment: "settings",
        icon: Settings,
        permissionKeys: [
          "settings.read",
          "settings.manage",
          "company.update",
          "accounting_settings.view",
          "accounting_settings.manage",
          "tax.view",
          "tax.manage",
        ],
      },
    ],
  },
];

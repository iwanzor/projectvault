"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const segmentLabels: Record<string, string> = {
  setup: "Setup",
  sales: "Sales",
  projects: "Projects",
  accounting: "Accounting",
  warehouse: "Warehouse",
  reports: "Reports",
  admin: "Admin",
  quotations: "Quotations",
  items: "Items",
  "combo-items": "Combo Items",
  "cost-items": "Cost Items",
  brands: "Brands",
  categories: "Categories",
  "sub-categories-1": "Sub-Category 1",
  "sub-categories-2": "Sub-Category 2",
  units: "Units",
  "packing-types": "Packing Types",
  customers: "Customers",
  suppliers: "Suppliers",
  currencies: "Currencies",
  countries: "Countries",
  cities: "Cities",
  areas: "Areas",
  vat: "VAT",
  "quotation-terms": "Quotation Terms",
  documents: "Documents",
  pickup: "Pickup",
  "currency-preview": "Currency Preview",
  timeline: "Timeline",
  lpo: "Purchase Orders",
  payables: "Account Payable",
  receivables: "Account Receivable",
  "expected-payables": "Expected AP",
  "expected-receivables": "Expected AR",
  banks: "Banks",
  "bank-accounts": "Bank Accounts",
  "payment-types": "Payment Types",
  "payment-channels": "Payment Through",
  purposes: "Purposes",
  archive: "Archive",
  "physical-stock": "Physical Stock",
  grn: "GRN",
  gin: "GIN",
  gtn: "GTN",
  grrn: "GRRN",
  labels: "Labels",
  users: "Users",
  permissions: "Permissions",
  new: "New",
};

function formatSegment(segment: string): string {
  if (segmentLabels[segment]) return segmentLabels[segment];
  // If it looks like a dynamic segment (number or UUID), skip labeling
  if (/^\d+$/.test(segment)) return `#${segment}`;
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const breadcrumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label = formatSegment(segment);
    const isLast = index === segments.length - 1;

    return { href, label, isLast };
  });

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 px-6 py-3 text-sm text-gray-500"
    >
      <Link
        href="/"
        className="flex items-center hover:text-gray-700 transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {breadcrumbs.map(({ href, label, isLast }) => (
        <span key={href} className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
          {isLast ? (
            <span className="font-medium text-gray-900">{label}</span>
          ) : (
            <Link
              href={href}
              className="hover:text-gray-700 transition-colors"
            >
              {label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

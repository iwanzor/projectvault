import Link from "next/link";
import {
  Globe,
  Building2,
  Tags,
  Package,
  Wrench,
  DollarSign,
  FileText,
  Users,
  Truck,
  Calculator,
  Boxes,
} from "lucide-react";

const setupGroups = [
  {
    title: "Geography",
    items: [
      { label: "Countries", href: "/setup/countries", icon: Globe },
      { label: "Cities", href: "/setup/cities", icon: Building2 },
      { label: "Areas", href: "/setup/areas", icon: Globe },
    ],
  },
  {
    title: "Product Categories",
    items: [
      { label: "Brands", href: "/setup/brands", icon: Tags },
      { label: "Categories", href: "/setup/categories", icon: Tags },
      { label: "Sub-Category 1", href: "/setup/sub-categories-1", icon: Tags },
      { label: "Sub-Category 2", href: "/setup/sub-categories-2", icon: Tags },
    ],
  },
  {
    title: "Units & Packaging",
    items: [
      { label: "Units (UOM)", href: "/setup/units", icon: Wrench },
      { label: "Packing Types", href: "/setup/packing-types", icon: Package },
    ],
  },
  {
    title: "Financial",
    items: [
      { label: "Currencies", href: "/setup/currencies", icon: DollarSign },
      { label: "VAT Rates", href: "/setup/vat", icon: Calculator },
      { label: "Quotation Terms", href: "/setup/quotation-terms", icon: FileText },
    ],
  },
  {
    title: "Documents",
    items: [
      { label: "Document Info", href: "/setup/documents", icon: FileText },
      { label: "Pickup", href: "/setup/pickup", icon: Truck },
    ],
  },
  {
    title: "Master Data",
    items: [
      { label: "Items", href: "/setup/items", icon: Package },
      { label: "Combo Items", href: "/setup/combo-items", icon: Boxes },
      { label: "Cost Items", href: "/setup/cost-items", icon: DollarSign },
      { label: "Customers", href: "/setup/customers", icon: Users },
      { label: "Suppliers", href: "/setup/suppliers", icon: Truck },
    ],
  },
];

export default function SetupPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Setup</h1>
        <p className="mt-1 text-gray-600">
          Master data management for products, classifications, business
          partners, and geography.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {setupGroups.map((group) => (
          <div
            key={group.title}
            className="rounded-lg border border-gray-200 bg-white shadow-sm"
          >
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-900">
                {group.title}
              </h3>
            </div>
            <div className="p-2">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-blue-600"
                  >
                    <Icon className="h-4 w-4 text-gray-400" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

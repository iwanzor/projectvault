"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, User, Building2 } from "lucide-react";
import { usePathname } from "next/navigation";

const routeTitles: Record<string, string> = {
  "/": "Dashboard",
  "/sales": "Sales",
  "/sales/quotations": "Sales Quotations",
  "/sales/currency-preview": "Currency Preview",
  "/setup": "Setup",
  "/setup/items": "Items",
  "/setup/combo-items": "Combo Items",
  "/setup/cost-items": "Cost Items",
  "/setup/brands": "Brands",
  "/setup/categories": "Categories",
  "/setup/sub-categories-1": "Sub-Category 1",
  "/setup/sub-categories-2": "Sub-Category 2",
  "/setup/units": "Units of Measure",
  "/setup/packing-types": "Packing Types",
  "/setup/customers": "Customers",
  "/setup/suppliers": "Suppliers",
  "/setup/currencies": "Currencies",
  "/setup/countries": "Countries",
  "/setup/cities": "Cities",
  "/setup/areas": "Areas",
  "/setup/vat": "VAT Settings",
  "/setup/quotation-terms": "Quotation Terms",
  "/setup/documents": "Document Info",
  "/setup/pickup": "Pickup",
  "/projects": "Projects",
  "/projects/timeline": "Project Timeline",
  "/accounting": "Accounting",
  "/accounting/lpo": "Purchase Orders",
  "/accounting/payables": "Account Payable",
  "/accounting/receivables": "Account Receivable",
  "/accounting/expected-payables": "Expected AP",
  "/accounting/expected-receivables": "Expected AR",
  "/accounting/banks": "Banks",
  "/accounting/bank-accounts": "Bank Accounts",
  "/accounting/payment-types": "Payment Types",
  "/accounting/payment-channels": "Payment Through",
  "/accounting/purposes": "Purposes",
  "/accounting/archive": "Archive",
  "/warehouse": "Warehouse",
  "/warehouse/physical-stock": "Physical Stock",
  "/warehouse/grn": "Goods Received Notes",
  "/warehouse/gin": "Goods Issue Notes",
  "/warehouse/gtn": "Goods Transfer Notes",
  "/warehouse/grrn": "Goods Return Notes",
  "/warehouse/labels": "Label Printing",
  "/reports": "Reports",
  "/reports/quotations": "SQ Reports",
  "/admin": "Administration",
  "/admin/users": "Users",
  "/admin/permissions": "Permissions",
};

function getPageTitle(pathname: string): string {
  if (routeTitles[pathname]) return routeTitles[pathname];

  const segments = pathname.split("/").filter(Boolean);
  while (segments.length > 0) {
    const path = "/" + segments.join("/");
    if (routeTitles[path]) return routeTitles[path];
    segments.pop();
  }

  return "Dashboard";
}

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Branch Indicator */}
        {session?.user?.branchCode && (
          <div className="flex items-center gap-1.5 rounded-md bg-blue-50 px-3 py-1.5 text-sm text-blue-700">
            <Building2 className="h-3.5 w-3.5" />
            <span>{session.user.branchCode}</span>
          </div>
        )}

        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-600">
              <User className="h-4 w-4" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-700">
                {session?.user?.username || "User"}
              </p>
              <p className="text-xs text-gray-500">
                {session?.user?.isAdmin ? "Administrator" : "User"}
              </p>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Permission } from "@/types/next-auth";
import {
  LayoutDashboard,
  ShoppingCart,
  Settings,
  FolderKanban,
  Calculator,
  Warehouse,
  BarChart3,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Package,
  Tags,
  Users,
  Globe,
  Wrench,
  FileText,
  DollarSign,
  ClipboardList,
  Boxes,
  Truck,
  ArrowLeftRight,
  RotateCcw,
  Printer,
  Building2,
  CreditCard,
  Landmark,
  BookOpen,
  Archive,
  GanttChart,
  Briefcase,
  Clock,
  UserCheck,
  Building,
  FolderOpen,
  MessageSquare,
  Activity,
  TrendingUp,
  Menu,
  X,
} from "lucide-react";

type NavItem = {
  label: string;
  href?: string;
  icon: React.ElementType;
  module?: string;
  children?: NavItem[];
};

const navigation: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Sales",
    icon: ShoppingCart,
    module: "SALES",
    children: [
      { label: "Quotations", href: "/sales/quotations", icon: FileText },
      { label: "Currency Preview", href: "/sales/currency-preview", icon: DollarSign },
    ],
  },
  {
    label: "Setup",
    icon: Settings,
    module: "SETUP",
    children: [
      {
        label: "Products",
        icon: Package,
        children: [
          { label: "Items", href: "/setup/items", icon: Package },
          { label: "Combo Items", href: "/setup/combo-items", icon: Boxes },
          { label: "Cost Items", href: "/setup/cost-items", icon: DollarSign },
        ],
      },
      {
        label: "Classifications",
        icon: Tags,
        children: [
          { label: "Brands", href: "/setup/brands", icon: Tags },
          { label: "Categories", href: "/setup/categories", icon: Tags },
          { label: "Sub-Category 1", href: "/setup/sub-categories-1", icon: Tags },
          { label: "Sub-Category 2", href: "/setup/sub-categories-2", icon: Tags },
          { label: "UOM", href: "/setup/units", icon: Wrench },
          { label: "Packing Types", href: "/setup/packing-types", icon: Package },
        ],
      },
      {
        label: "Business Partners",
        icon: Users,
        children: [
          { label: "Customers", href: "/setup/customers", icon: Users },
          { label: "Suppliers", href: "/setup/suppliers", icon: Truck },
          { label: "Currencies", href: "/setup/currencies", icon: DollarSign },
        ],
      },
      {
        label: "Geography",
        icon: Globe,
        children: [
          { label: "Countries", href: "/setup/countries", icon: Globe },
          { label: "Cities", href: "/setup/cities", icon: Building2 },
          { label: "Areas", href: "/setup/areas", icon: Globe },
        ],
      },
      {
        label: "Settings",
        icon: Wrench,
        children: [
          { label: "VAT", href: "/setup/vat", icon: Calculator },
          { label: "Quotation Terms", href: "/setup/quotation-terms", icon: FileText },
          { label: "Document Info", href: "/setup/documents", icon: FileText },
          { label: "Pickup", href: "/setup/pickup", icon: Truck },
        ],
      },
    ],
  },
  {
    label: "Projects",
    icon: FolderKanban,
    module: "PROJECT",
    children: [
      { label: "All Projects", href: "/projects", icon: FolderKanban },
      { label: "Gantt Chart", href: "/projects/timeline", icon: GanttChart },
    ],
  },
  {
    label: "Accounting",
    icon: Calculator,
    module: "ACCOUNT",
    children: [
      { label: "Purchase Orders", href: "/accounting/lpo", icon: ClipboardList },
      { label: "Account Payable", href: "/accounting/payables", icon: CreditCard },
      { label: "Account Receivable", href: "/accounting/receivables", icon: DollarSign },
      { label: "Expected AP", href: "/accounting/expected-payables", icon: CreditCard },
      { label: "Expected AR", href: "/accounting/expected-receivables", icon: DollarSign },
      {
        label: "Master Data",
        icon: BookOpen,
        children: [
          { label: "Banks", href: "/accounting/banks", icon: Landmark },
          { label: "Bank Accounts", href: "/accounting/bank-accounts", icon: Landmark },
          { label: "Payment Types", href: "/accounting/payment-types", icon: CreditCard },
          { label: "Payment Through", href: "/accounting/payment-channels", icon: CreditCard },
          { label: "Purposes", href: "/accounting/purposes", icon: BookOpen },
        ],
      },
      {
        label: "Employee Management",
        icon: Users,
        children: [
          { label: "Employees", href: "/accounting/employees", icon: Users },
          { label: "Employee Statuses", href: "/accounting/employee-statuses", icon: UserCheck },
          { label: "Positions", href: "/accounting/positions", icon: Briefcase },
          { label: "Departments", href: "/accounting/departments", icon: Building },
          { label: "Timesheets", href: "/accounting/timesheets", icon: Clock },
        ],
      },
      {
        label: "References",
        icon: BookOpen,
        children: [
          { label: "Acc Projects", href: "/accounting/acc-projects", icon: FolderOpen },
          { label: "Remarks", href: "/accounting/remarks", icon: MessageSquare },
        ],
      },
      { label: "Archive", href: "/accounting/archive", icon: Archive },
    ],
  },
  {
    label: "Warehouse",
    icon: Warehouse,
    module: "WAREHOUSE",
    children: [
      { label: "Physical Stock", href: "/warehouse/physical-stock", icon: Boxes },
      { label: "GRN", href: "/warehouse/grn", icon: Truck },
      { label: "GIN", href: "/warehouse/gin", icon: ArrowLeftRight },
      { label: "GTN", href: "/warehouse/gtn", icon: ArrowLeftRight },
      { label: "GRRN", href: "/warehouse/grrn", icon: RotateCcw },
      { label: "Label Printing", href: "/warehouse/labels", icon: Printer },
    ],
  },
  {
    label: "Reports",
    icon: BarChart3,
    module: "REPORTS",
    children: [
      { label: "SQ Reports", href: "/reports/quotations", icon: FileText },
      { label: "Currency Report", href: "/reports/currency", icon: DollarSign },
      { label: "Project Report", href: "/reports/projects", icon: FolderKanban },
      { label: "Financial Report", href: "/reports/financial", icon: TrendingUp },
      { label: "Warehouse Report", href: "/reports/warehouse", icon: Warehouse },
      { label: "Timesheet Report", href: "/reports/timesheets", icon: Clock },
      { label: "Activity Log", href: "/reports/activity", icon: Activity },
      { label: "Financial Statements", href: "/reports/financial-statements", icon: BookOpen },
    ],
  },
  {
    label: "Admin",
    icon: ShieldCheck,
    module: "ADMIN",
    children: [
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Permissions", href: "/admin/permissions", icon: ShieldCheck },
    ],
  },
];

interface SidebarProps {
  userPermissions: Permission[];
  isAdmin: boolean;
}

export function Sidebar({ userPermissions, isAdmin }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const pathname = usePathname();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  const hasPermission = (item: NavItem): boolean => {
    if (isAdmin) return true;
    if (!item.module) return true;
    if (item.module === "ADMIN") return false; // Only admins see admin
    return userPermissions.some(
      (p) => p.module === item.module && p.viewAll
    );
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const isGroupActive = (item: NavItem): boolean => {
    if (item.href && isActive(item.href)) return true;
    if (item.children) {
      return item.children.some((child) => isGroupActive(child));
    }
    return false;
  };

  const renderNavItem = (item: NavItem, depth: number = 0): React.ReactNode => {
    if (!hasPermission(item)) return null;

    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedGroups.has(item.label);
    const active = isActive(item.href);
    const groupActive = isGroupActive(item);

    if (hasChildren) {
      return (
        <div key={item.label}>
          <button
            onClick={() => toggleGroup(item.label)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              "hover:bg-slate-800 hover:text-white",
              groupActive ? "text-white" : "text-slate-400",
              collapsed && depth === 0 && "justify-center px-2"
            )}
            title={collapsed ? item.label : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform",
                    isExpanded && "rotate-180"
                  )}
                />
              </>
            )}
          </button>
          {!collapsed && isExpanded && (
            <div className={cn("ml-4 mt-1 space-y-1", depth > 0 && "ml-3")}>
              {item.children!.map((child) => renderNavItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.label}
        href={item.href || "#"}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
          "hover:bg-slate-800 hover:text-white",
          active
            ? "bg-slate-800 text-white font-medium"
            : "text-slate-400",
          collapsed && depth === 0 && "justify-center px-2"
        )}
        title={collapsed ? item.label : undefined}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white shadow-lg md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "flex h-screen flex-col bg-slate-900 text-white transition-all duration-300",
          // Desktop: always visible
          "hidden md:flex",
          collapsed ? "md:w-16" : "md:w-64",
          // Mobile: overlay drawer
          mobileOpen && "fixed inset-y-0 left-0 z-50 !flex w-64"
        )}
      >
        {/* Logo / Brand */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
          {(!collapsed || mobileOpen) && (
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold">
                PV
              </div>
              <span className="text-lg font-semibold">ProjectVault</span>
            </Link>
          )}
          {collapsed && !mobileOpen && (
            <Link href="/" className="mx-auto">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold">
                PV
              </div>
            </Link>
          )}
          {/* Mobile close button */}
          {mobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="ml-auto text-slate-400 hover:text-white md:hidden"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navigation.map((item) => renderNavItem(item))}
        </nav>

        {/* Collapse Toggle - desktop only */}
        <div className="hidden border-t border-slate-800 p-3 md:block">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

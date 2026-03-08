import type { Metadata } from "next";

export const metadata: Metadata = { title: "Accounting | ProjectVault" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

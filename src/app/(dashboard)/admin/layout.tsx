import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin | ProjectVault" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

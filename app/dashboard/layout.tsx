import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false }, // private pages stay out of search engines
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
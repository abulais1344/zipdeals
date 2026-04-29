import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Suspense } from "react";
import { headers } from "next/headers";
import { unstable_noStore as noStore } from "next/cache";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZipDeals — Local Clearance Deals & Bulk Stock",
  description:
    "Discover genuine clearance deals and bulk stock near you. Contact sellers directly on WhatsApp. No middlemen.",
  keywords: "clearance sale, local deals, bulk stock, wholesale, discount",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  noStore();
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? headerStore.get("next-url") ?? "";
  const isAdminRoute = pathname.startsWith("/admin");
  const isSellerAppRoute =
    pathname.startsWith("/seller/dashboard") ||
    pathname.startsWith("/seller/listings") ||
    pathname.startsWith("/sell/new") ||
    pathname.startsWith("/sell/success");

  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50">
        {!isSellerAppRoute && (
          <Suspense
            fallback={<div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm h-14" />}
          >
            <Navbar forceAdminTheme={isAdminRoute} />
          </Suspense>
        )}
        <main className={`flex-1 ${isSellerAppRoute ? "" : "pb-20 md:pb-0"}`}>{children}</main>
        {!isSellerAppRoute && (
          <footer className="site-footer hidden md:block border-t border-gray-100 bg-white py-6 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} ZipDeals · Local Clearance Deals & Bulk Stock
          </footer>
        )}
      </body>
    </html>
  );
}

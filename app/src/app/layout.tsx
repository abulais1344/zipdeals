import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Suspense } from "react";
import { headers } from "next/headers";
import { unstable_noStore as noStore } from "next/cache";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zipdeals.in";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "ZipDeals — Local Clearance Deals & Bulk Stock",
  description:
    "Discover genuine clearance deals and bulk stock near you. Contact sellers directly on WhatsApp. No middlemen.",
  keywords: "clearance sale, local deals, bulk stock, wholesale, discount",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "ZipDeals",
    title: "ZipDeals | Local Clearance Deals & Bulk Stock",
    description:
      "Discover local clearance deals and bulk stock from verified sellers. Contact directly on WhatsApp and move inventory faster.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "ZipDeals logo and brand preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZipDeals | Local Clearance Deals & Bulk Stock",
    description:
      "Discover local clearance deals and bulk stock from verified sellers. Contact directly on WhatsApp and move inventory faster.",
    images: ["/twitter-image"],
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
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
    pathname.startsWith("/seller/account") ||
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
          <footer className="site-footer border-t border-gray-100 bg-white py-6 pb-24 text-xs text-gray-400 md:pb-6">
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4">
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-gray-500">
                <Link href="/privacy" className="hover:text-gray-700">
                  Privacy
                </Link>
                <Link href="/terms" className="hover:text-gray-700">
                  Terms
                </Link>
                <Link href="/cookies" className="hover:text-gray-700">
                  Cookies
                </Link>
                <Link href="/seller-terms" className="hover:text-gray-700">
                  Seller Terms
                </Link>
                <Link href="/contact-legal" className="hover:text-gray-700">
                  Contact & Grievance
                </Link>
              </div>
              <p className="text-center">© {new Date().getFullYear()} ZipDeals · Local Clearance Deals & Bulk Stock</p>
            </div>
          </footer>
        )}
      </body>
    </html>
  );
}

import Link from "next/link";
import { headers } from "next/headers";
import { unstable_noStore as noStore } from "next/cache";
import { Home, LayoutDashboard, Search, Shield, Zap } from "lucide-react";
import SellerLogoutButton from "@/components/SellerLogoutButton";
import { getSellerSession } from "@/lib/seller-auth";

interface Props {
  forceAdminTheme?: boolean;
}

export default async function Navbar({ forceAdminTheme = false }: Props) {
  noStore();
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? headerStore.get("next-url") ?? "";
  const isSellerAppRoute =
    pathname.startsWith("/seller/dashboard") ||
    pathname.startsWith("/seller/listings") ||
    pathname.startsWith("/sell/new") ||
    pathname.startsWith("/sell/success");

  if (isSellerAppRoute) {
    return null;
  }

  const isAdminContext = forceAdminTheme;
  const sellerSession = isAdminContext ? null : await getSellerSession();
  const sellerDisplayName = sellerSession?.seller_name || sellerSession?.username || "Seller";
  const isSellerLoggedIn = Boolean(sellerSession);
  const primaryHref = isSellerLoggedIn ? "/seller/dashboard" : "/sell";
  const primaryLabel = isSellerLoggedIn ? "Back to Dashboard" : "Sell";

  return (
    <header className="global-navbar sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm safe-top-pad">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <Link
          href={isAdminContext ? "/admin/pending" : "/"}
          className={`flex items-center gap-1.5 font-extrabold text-lg tracking-tight ${
            isAdminContext ? "text-slate-700" : "text-orange-500"
          }`}
        >
          {isAdminContext ? <Shield size={20} strokeWidth={2.5} /> : <Zap size={20} strokeWidth={2.5} />}
          {isAdminContext ? "ZipDeals Admin" : "ZipDeals"}
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {isAdminContext ? (
            <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-semibold tracking-wide">
              Admin Workspace
            </span>
          ) : (
            <>
              {isSellerLoggedIn && (
                <Link href="/seller/dashboard" className="inline-flex max-w-56 items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100 transition-colors shadow-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-500 flex-shrink-0" />
                  <span className="truncate">Seller: {sellerDisplayName}</span>
                </Link>
              )}
              <Link
                href="/browse"
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Browse deals
              </Link>
              <Link
                href={primaryHref}
                className="ml-1 px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {primaryLabel}
              </Link>
              {isSellerLoggedIn && <SellerLogoutButton />}
            </>
          )}
        </nav>

        <div className="md:hidden flex items-center gap-2">
          {isAdminContext ? (
            <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-semibold tracking-wide">
              Admin
            </span>
          ) : isSellerLoggedIn ? (
            <>
              <Link href="/seller/dashboard" className="inline-flex max-w-36 items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100 transition-colors shadow-sm">
                <span className="h-2 w-2 rounded-full bg-orange-500 flex-shrink-0" />
                <span className="truncate">{sellerDisplayName}</span>
              </Link>
              <SellerLogoutButton compact />
            </>
          ) : (
            <>
              <Link
                href="/browse"
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors active:scale-[0.98]"
              >
                Browse
              </Link>
              <Link
                href={primaryHref}
                className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors active:scale-[0.98]"
              >
                {primaryLabel}
              </Link>
            </>
          )}
        </div>
      </div>

      {!isAdminContext && isSellerLoggedIn && (
        <div className="border-t border-orange-100 bg-gradient-to-r from-orange-50 via-amber-50 to-white">
          <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-orange-900">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-orange-500" />
              <span className="font-semibold">Seller mode active</span>
              <span className="text-orange-700/90">You are browsing as {sellerDisplayName}.</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Link href="/sell/new" className="font-semibold text-orange-700 hover:text-orange-800">
                Create new listing
              </Link>
              <Link href="/seller/dashboard" className="font-medium text-gray-600 hover:text-gray-900">
                Open dashboard
              </Link>
            </div>
          </div>
        </div>
      )}

      {!isAdminContext && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 safe-bottom-pad">
          <div className="grid h-16 grid-cols-3">
            <Link href="/" className="flex flex-col items-center justify-center text-[11px] text-gray-600 gap-1 active:bg-gray-50 active:scale-[0.98] transition-transform">
              <Home size={16} />
              Home
            </Link>
            <Link href="/browse" className="flex flex-col items-center justify-center text-[11px] text-gray-600 gap-1 active:bg-gray-50 active:scale-[0.98] transition-transform">
              <Search size={16} />
              Browse
            </Link>
            <Link href={primaryHref} className="flex flex-col items-center justify-center text-[11px] text-orange-600 gap-1 active:bg-orange-50 font-semibold active:scale-[0.98] transition-transform">
              <LayoutDashboard size={16} />
              {isSellerLoggedIn ? "Dashboard" : "Sell"}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

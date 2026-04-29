"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useState } from "react";

interface SellerLogoutButtonProps {
  compact?: boolean;
  showLabel?: boolean;
}

export default function SellerLogoutButton({ compact = false, showLabel = true }: SellerLogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/seller/logout", { method: "POST" });
      router.push("/seller/login");
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={compact
        ? "inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        : "flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"}
    >
      <LogOut size={compact ? 14 : 18} />
      {showLabel && <span className={compact ? "text-xs font-semibold" : "text-sm font-medium"}>{loading ? "..." : "Logout"}</span>}
    </button>
  );
}

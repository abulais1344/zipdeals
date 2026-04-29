"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  listingId: string;
}

export default function MarkAsSoldButton({ listingId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleMarkAsSold() {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/seller/listings/mark-sold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to mark listing as sold");
      }

      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Unable to mark listing as sold");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleMarkAsSold}
      disabled={loading}
      className="px-2.5 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-60 transition-colors"
      title="Mark as sold"
    >
      {loading ? "Saving..." : "Mark sold"}
    </button>
  );
}
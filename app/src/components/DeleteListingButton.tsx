"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

interface Props {
  listingId: string;
  listingTitle: string;
}

export default function DeleteListingButton({ listingId, listingTitle }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (loading) return;

    const confirmed = window.confirm(`Delete "${listingTitle}"? This cannot be undone.`);
    if (!confirmed) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/seller/listings/${listingId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to delete listing");
      }

      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Unable to delete listing");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-1.5 text-gray-600 hover:bg-red-100 hover:text-red-600 rounded transition-colors disabled:opacity-60"
      title={loading ? "Deleting..." : "Delete"}
      aria-label={loading ? "Deleting listing" : `Delete ${listingTitle}`}
    >
      <Trash2 size={16} />
    </button>
  );
}
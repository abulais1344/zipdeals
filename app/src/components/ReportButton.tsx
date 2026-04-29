"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Flag } from "lucide-react";

export default function ReportButton({ productId }: { productId: string }) {
  const [reported, setReported] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleReport() {
    if (reported || submitting) return;
    setSubmitting(true);
    const supabase = createClient();
    const isMobile = typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false;
    await supabase.from("reports").insert({ product_id: productId });
    await supabase.from("events").insert({
      product_id: productId,
      event_type: "report",
      event_context: {
        source: "listing_detail",
        is_mobile: isMobile,
      },
    });
    setReported(true);
    setSubmitting(false);
  }

  return (
    <button
      onClick={handleReport}
      disabled={reported || submitting}
      className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 disabled:text-gray-300 transition-colors"
    >
      <Flag size={12} />
      {reported ? "Reported — thanks" : "Report this listing"}
    </button>
  );
}

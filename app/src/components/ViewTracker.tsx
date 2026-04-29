"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ViewTracker({ productId }: { productId: string }) {
  useEffect(() => {
    const supabase = createClient();
    const isMobile = typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false;
    Promise.all([
      supabase.from("events").insert({
        product_id: productId,
        event_type: "view",
        event_context: {
          source: "listing_detail",
          is_mobile: isMobile,
        },
      }),
      supabase.rpc("increment_view", { product_uuid: productId }),
    ]).catch(() => {});
  }, [productId]);

  return null;
}

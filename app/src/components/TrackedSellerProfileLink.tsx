"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Props {
  href: string;
  productId: string;
  city?: string | null;
  source: string;
  className?: string;
  children: React.ReactNode;
}

function isMobileViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px)").matches;
}

export default function TrackedSellerProfileLink({ href, productId, city, source, className, children }: Props) {
  function trackClick() {
    const supabase = createClient();

    void supabase.from("events").insert({
      product_id: productId,
      event_type: "seller_profile_click",
      city: city ?? null,
      event_context: {
        source,
        is_mobile: isMobileViewport(),
      },
    });
  }

  return (
    <Link href={href} className={className} onClick={trackClick}>
      {children}
    </Link>
  );
}

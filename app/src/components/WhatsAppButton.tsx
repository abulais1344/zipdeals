"use client";

import { Product } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { MessageCircle } from "lucide-react";

interface Props {
  product: Product;
  className?: string;
  source?: string;
  ctaLabel?: string;
}

function buildWhatsAppUrl(product: Product): string {
  const phone = product.seller_phone.replace(/\D/g, "");
  const fullPhone = phone.startsWith("91") ? phone : `91${phone}`;
  const message = product.is_bulk
    ? `Hi, I saw your bulk listing for *${product.title}* on ZipDeals.\n\nIs it available? I'm interested in bulk purchase. Please share best price and quantity available.`
    : `Hi, I saw your listing for *${product.title}* at ₹${product.price.toLocaleString("en-IN")} on ZipDeals. Is it available?\n\nI'm interested. Can you share more details and best price?`;
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
}

function isMobileViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px)").matches;
}

export default function WhatsAppButton({ product, className, source = "listing_detail", ctaLabel }: Props) {
  async function handleClick() {
    const supabase = createClient();

    // Fire and forget — track in both events table and counter
    Promise.all([
      supabase.from("events").insert({
        product_id: product.id,
        event_type: "whatsapp_click",
        city: product.city,
        event_context: {
          source,
          is_mobile: isMobileViewport(),
        },
      }),
      supabase.rpc("increment_whatsapp_click", { product_uuid: product.id }),
    ]).catch(() => {});

    window.open(buildWhatsAppUrl(product), "_blank", "noopener,noreferrer");
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center justify-center gap-2 py-3.5 bg-[#25D366] hover:bg-[#1ebe5d] active:bg-[#18b454] active:scale-[0.99] text-white font-bold rounded-xl text-base transition-all shadow-sm ${className ?? ""}`}
    >
      <MessageCircle size={20} />
      {ctaLabel ?? "Chat Now & Get Best Price"}
    </button>
  );
}

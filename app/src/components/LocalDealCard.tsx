import Link from "next/link";
import Image from "next/image";
import { Product } from "@/lib/types";
import { MapPin, Package } from "lucide-react";
import WhatsAppButton from "@/components/WhatsAppButton";

interface Props {
  product: Product;
  sellerProfileHref?: string | null;
}

type LocalDealTag = {
  label: "Today Only" | "Limited Time" | "Clearance";
};

function getPrimaryDealTag(product: Product): LocalDealTag | null {
  if (product.dealType === "Today Only") return { label: "Today Only" };
  if (product.dealType === "Limited Time") return { label: "Limited Time" };
  if (product.dealType === "Clearance") return { label: "Clearance" };
  return null;
}

function getUrgencyText(validTill?: string): string | null {
  if (!validTill) return null;
  const validTillTime = new Date(validTill).getTime();
  if (!Number.isFinite(validTillTime)) return null;

  const diffMs = validTillTime - Date.now();
  if (diffMs <= 0) return "⏳ Ends soon";

  const diffHours = Math.ceil(diffMs / (60 * 60 * 1000));
  if (diffHours <= 12) return `⏳ Ends in ${diffHours} hour${diffHours === 1 ? "" : "s"}`;

  const validTillDate = new Date(validTill);
  if (new Date().toDateString() === validTillDate.toDateString()) {
    return `⏳ Ends today at ${validTillDate.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}`;
  }

  return `⏳ Ends ${validTillDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
}

export default function LocalDealCard({ product }: Props) {
  const primaryDealTag = getPrimaryDealTag(product);
  const urgencyText = getUrgencyText(product.validTill);

  return (
    <div className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden active:scale-[0.99] flex flex-row">
      {/* Left: square image */}
      <Link href={`/listings/${product.id}`} className="block shrink-0">
        <div className="relative w-28 h-full min-h-[112px] bg-gray-100 overflow-hidden">
          {product.image_urls[0] ? (
            <Image
              src={product.image_urls[0]}
              alt={product.title}
              fill
              sizes="112px"
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <Package size={24} />
            </div>
          )}
          {product.discount_pct > 0 && (
            <div className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {product.discount_pct}% OFF
            </div>
          )}
        </div>
      </Link>

      {/* Right: content */}
      <div className="flex flex-col flex-1 p-3 min-w-0">
        <Link href={`/listings/${product.id}`} className="block min-w-0 space-y-1">
          <h3 className="text-sm font-semibold text-gray-900 truncate leading-tight">
            {product.title}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-gray-900">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
            <span className="text-xs text-gray-400 line-through">
              ₹{product.original_price.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500 overflow-hidden">
            <MapPin size={10} className="shrink-0" />
            <span className="truncate">{product.taluka ? `${product.taluka}, ${product.city}` : product.city}</span>
          </div>
        </Link>

        {/* Deal tag + urgency row */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {primaryDealTag && (
            <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-orange-50 text-orange-700 border-orange-200 shrink-0">
              {primaryDealTag.label}
            </span>
          )}
          {urgencyText && (
            <span className="text-[10px] text-gray-500 truncate">{urgencyText}</span>
          )}
        </div>

        {/* CTA */}
        <div className="mt-2">
          <WhatsAppButton
            product={product}
            source="local_city_deals"
            ctaLabel="WhatsApp / Contact Seller"
            className="py-2 text-xs rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}

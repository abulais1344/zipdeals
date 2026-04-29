import Link from "next/link";
import Image from "next/image";
import { Product } from "@/lib/types";
import { MapPin, Package, User } from "lucide-react";
import TrackedSellerProfileLink from "@/components/TrackedSellerProfileLink";

interface Props {
  product: Product;
  sellerProfileHref?: string | null;
}

type UrgencyBadge = {
  icon: string;
  label: string;
  className: string;
};

function getUrgencyBadge(product: Product): UrgencyBadge | null {
  const now = Date.now();
  const createdAt = new Date(product.created_at).getTime();
  const expiresAt = new Date(product.expires_at).getTime();

  const isPostedToday = Number.isFinite(createdAt) && now - createdAt <= 24 * 60 * 60 * 1000;
  if (isPostedToday) {
    return {
      icon: "🔥",
      label: "Posted today",
      className: "bg-orange-50 text-orange-700 border-orange-200",
    };
  }

  const isSellingFast = product.whatsapp_clicks >= 5 || (product.views_count >= 60 && product.whatsapp_clicks >= 2);
  if (isSellingFast) {
    return {
      icon: "⚡",
      label: "Selling fast",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    };
  }

  const expiresSoon = Number.isFinite(expiresAt) && expiresAt - now <= 48 * 60 * 60 * 1000;
  if (expiresSoon) {
    return {
      icon: "⏳",
      label: "Limited stock",
      className: "bg-slate-50 text-slate-700 border-slate-200",
    };
  }

  return null;
}

export default function ListingCard({ product, sellerProfileHref }: Props) {
  const urgencyBadge = getUrgencyBadge(product);

  return (
    <div className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden active:scale-[0.99]">
      <Link href={`/listings/${product.id}`} className="block">
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          {product.image_urls[0] ? (
            <Image
              src={product.image_urls[0]}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <Package size={32} />
            </div>
          )}
          {product.discount_pct > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {product.discount_pct}% OFF
            </div>
          )}
          {product.is_bulk && (
            <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              BULK
            </div>
          )}
        </div>
      </Link>

      <div className="p-3 space-y-2">
        <Link href={`/listings/${product.id}`} className="block space-y-2">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
            {product.title}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-gray-900">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
            <span className="text-xs text-gray-400 line-through">
              ₹{product.original_price.toLocaleString("en-IN")}
            </span>
          </div>
        </Link>

        {sellerProfileHref ? (
          <TrackedSellerProfileLink
            href={sellerProfileHref}
            productId={product.id}
            city={product.city}
            source="listing_card"
            className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2 py-1.5 rounded hover:bg-orange-50 hover:text-orange-700 active:bg-orange-50 active:text-orange-700 transition-colors active:scale-[0.99]"
          >
            <User size={12} />
            <span className="truncate font-medium">{product.seller_name}</span>
          </TrackedSellerProfileLink>
        ) : (
          <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2 py-1.5 rounded">
            <User size={12} />
            <span className="truncate font-medium">{product.seller_name}</span>
          </div>
        )}

        <Link href={`/listings/${product.id}`} className="block">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin size={11} />
            <span>{product.taluka ? `${product.taluka}, ${product.city}` : product.city}</span>
            <span className="mx-1">·</span>
            <span className="truncate">{product.category}</span>
          </div>
        </Link>

        {urgencyBadge && (
          <Link href={`/listings/${product.id}`} className="block pt-0.5">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full border ${urgencyBadge.className}`}
            >
              <span aria-hidden>{urgencyBadge.icon}</span>
              <span>{urgencyBadge.label}</span>
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}

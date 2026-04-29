"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client"; // used for Storage image uploads only
import { CATEGORIES, CITIES, TALUKAS, MAX_IMAGES, MAX_IMAGE_SIZE_MB } from "@/lib/constants";
import { LayoutDashboard, X, ImagePlus } from "lucide-react";
import IdleLogout from "@/components/IdleLogout";
import SellerLogoutButton from "@/components/SellerLogoutButton";

interface FormState {
  seller_id: string;
  title: string;
  description: string;
  brand: string;
  item_condition: string;
  clearance_reason: string;
  price: string;
  original_price: string;
  category: string;
  city: string;
  taluka: string;
  is_bulk: boolean;
  min_order_qty: string;
  bulk_price: string;
  condition_confirmed: boolean;
}

const INITIAL: FormState = {
  seller_id: "",
  title: "",
  description: "",
  brand: "",
  item_condition: "",
  clearance_reason: "",
  price: "",
  original_price: "",
  category: "",
  city: "",
  taluka: "",
  is_bulk: false,
  min_order_qty: "",
  bulk_price: "",
  condition_confirmed: false,
};

export default function NewListingClient({ sellerName }: { sellerName: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>(INITIAL);
  const [loadingSellerProfile, setLoadingSellerProfile] = useState(true);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadSellerProfile() {
      try {
        const res = await fetch("/api/seller/me", { method: "GET" });

        if (res.status === 401) {
          router.replace("/seller/login");
          return;
        }

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Unable to load seller profile.");
          return;
        }

        setForm((prev) => ({
          ...prev,
          seller_id: data.seller_id,
        }));
      } catch {
        setError("Unable to load seller profile.");
      } finally {
        setLoadingSellerProfile(false);
      }
    }

    loadSellerProfile();
  }, [router]);

  function set(field: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function discountPct() {
    const price = parseFloat(form.price);
    const originalPrice = parseFloat(form.original_price);
    if (price > 0 && originalPrice > 0 && originalPrice > price) {
      return Math.round(((originalPrice - price) / originalPrice) * 100);
    }
    return null;
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const remaining = MAX_IMAGES - images.length;
    const toAdd = files.slice(0, remaining);
    const invalid = toAdd.filter((file) => file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024);

    if (invalid.length) {
      setError(`Each image must be under ${MAX_IMAGE_SIZE_MB}MB`);
      return;
    }

    setImages((prev) => [...prev, ...toAdd]);
    setPreviews((prev) => [...prev, ...toAdd.map((file) => URL.createObjectURL(file))]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  }

  async function uploadImages(): Promise<string[]> {
    const supabase = createClient();
    const urls: string[] = [];
    for (const file of images) {
      const ext = file.name.split(".").pop();
      const path = `public/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("listing-images")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);
      const { data } = supabase.storage.from("listing-images").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (loadingSellerProfile || !form.seller_id) {
      setError("Seller profile not loaded. Please login again.");
      return;
    }

    if (images.length === 0) {
      setError("Please add at least one image.");
      return;
    }
    if (!form.condition_confirmed) {
      setError("Please confirm the item condition.");
      return;
    }
    if (!form.brand.trim() || !form.item_condition.trim() || !form.clearance_reason.trim()) {
      setError("Please provide brand, item condition, and reason for clearance.");
      return;
    }
    const price = parseFloat(form.price);
    const originalPrice = parseFloat(form.original_price);
    if (price >= originalPrice) {
      setError("Sale price must be less than the original price.");
      return;
    }

    setSubmitting(true);

    try {
      const imageUrls = await uploadImages();

      const additionalNotes = form.description.trim();
      const structuredDescription = [
        `Brand: ${form.brand.trim()}`,
        `Condition: ${form.item_condition.trim()}`,
        `Reason for clearance: ${form.clearance_reason.trim()}`,
        additionalNotes ? `Notes: ${additionalNotes}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const payload = {
        title: form.title.trim(),
        description: structuredDescription,
        price,
        original_price: originalPrice,
        image_urls: imageUrls,
        city: form.city,
        taluka: form.taluka || null,
        category: form.category,
        is_bulk: form.is_bulk,
        min_order_qty: form.is_bulk && form.min_order_qty ? parseInt(form.min_order_qty) : null,
        bulk_price: form.is_bulk && form.bulk_price ? parseFloat(form.bulk_price) : null,
      };

      const res = await fetch("/api/seller/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        router.replace("/seller/login");
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create listing.");
      }

      router.push("/sell/success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  const discount = discountPct();
  const availableTalukas = form.city ? (TALUKAS as Record<string, string[]>)[form.city] ?? [] : [];
  const isTalukaRequired = form.city === "Nanded";

  return (
    <div data-seller-app-page="true" className="min-h-screen bg-gray-50 pb-28 md:pb-10">
      <IdleLogout logoutEndpoint="/api/seller/logout" redirectTo="/seller/login" />
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 mb-5 sm:mb-8">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-orange-600">
              <LayoutDashboard size={20} />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">New Listing</h1>
              <p className="text-sm text-gray-500">Welcome, {sellerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Link
              href="/browse"
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Browse deals
            </Link>
            <Link
              href="/seller/dashboard"
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Back to Dashboard
            </Link>
            <SellerLogoutButton />
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-3 sm:px-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">List a clearance item</h1>
        <p className="text-sm text-gray-500 mb-5 sm:mb-8">
          Your listing will be reviewed and activated within a few hours.
        </p>

        <form id="new-listing-form" onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Photos <span className="font-normal text-gray-400">(up to {MAX_IMAGES})</span>
            </label>
            <div className="flex flex-wrap gap-3">
              {previews.map((src, idx) => (
                <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                  <Image src={src} alt={`Image ${idx + 1}`} fill className="object-cover" unoptimized />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-black/60 rounded-full p-1 text-white hover:bg-black"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-orange-400 hover:text-orange-400 transition-colors"
                >
                  <ImagePlus size={20} />
                  <span className="text-xs mt-1">Add</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleImageSelect}
            />
          </div>

          <Field label="Item title" required>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Samsung 65&quot; TV — ex-display unit"
              maxLength={120}
              required
              className={inputCls}
            />
          </Field>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Optional additional notes (accessories, warranty, defects, pickup details)"
              rows={3}
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Brand" required>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => set("brand", e.target.value)}
                placeholder="e.g. Samsung"
                maxLength={60}
                required
                className={inputCls}
              />
            </Field>
            <Field label="Condition" required>
              <select
                value={form.item_condition}
                onChange={(e) => set("item_condition", e.target.value)}
                required
                className={inputCls}
              >
                <option value="">Select…</option>
                <option value="New">New</option>
                <option value="Like New">Like New</option>
                <option value="Open Box">Open Box</option>
                <option value="Used - Good">Used - Good</option>
              </select>
            </Field>
            <Field label="Reason for clearance" required>
              <select
                value={form.clearance_reason}
                onChange={(e) => set("clearance_reason", e.target.value)}
                required
                className={inputCls}
              >
                <option value="">Select…</option>
                <option value="Excess stock">Excess stock</option>
                <option value="Store closing">Store closing</option>
                <option value="Season end">Season end</option>
                <option value="Display unit">Display unit</option>
                <option value="Packaging damage">Packaging damage</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Sale price (₹)" required>
              <input
                type="number"
                min={1}
                step="0.01"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="2999"
                required
                className={inputCls}
              />
            </Field>
            <Field label="Original price (₹)" required>
              <input
                type="number"
                min={1}
                step="0.01"
                value={form.original_price}
                onChange={(e) => set("original_price", e.target.value)}
                placeholder="4999"
                required
                className={inputCls}
              />
            </Field>
          </div>
          {discount !== null && <p className="text-sm font-semibold text-green-600">{discount}% off — great deal!</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Category" required>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                required
                className={inputCls}
              >
                <option value="">Select…</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="City" required>
              <select
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                required
                className={inputCls}
              >
                <option value="">Select…</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>

          {availableTalukas.length > 0 && (
            <Field label="Taluka / Area" required={isTalukaRequired}>
              <select
                value={form.taluka}
                onChange={(e) => set("taluka", e.target.value)}
                required={isTalukaRequired}
                className={inputCls}
              >
                <option value="">{isTalukaRequired ? "Select…" : "Select (optional)…"}</option>
                {availableTalukas.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
          )}

          <p className="text-xs text-gray-500 -mt-1">
            Seller identity is taken securely from your approved account on submit.
          </p>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_bulk"
              checked={form.is_bulk}
              onChange={(e) => set("is_bulk", e.target.checked)}
              className="h-5 w-5 rounded border-gray-300 accent-orange-500"
            />
            <label htmlFor="is_bulk" className="text-sm font-medium text-gray-700">
              This is a bulk/lot deal
            </label>
          </div>
          {form.is_bulk && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Min. order qty">
                <input
                  type="number"
                  min={1}
                  value={form.min_order_qty}
                  onChange={(e) => set("min_order_qty", e.target.value)}
                  placeholder="10"
                  className={inputCls}
                />
              </Field>
              <Field label="Bulk price per unit (₹)">
                <input
                  type="number"
                  min={1}
                  step="0.01"
                  value={form.bulk_price}
                  onChange={(e) => set("bulk_price", e.target.value)}
                  placeholder="2500"
                  className={inputCls}
                />
              </Field>
            </div>
          )}

          <div className="flex items-start gap-3 bg-amber-50 rounded-lg p-3 border border-amber-100">
            <input
              type="checkbox"
              id="condition"
              checked={form.condition_confirmed}
              onChange={(e) => set("condition_confirmed", e.target.checked)}
              className="mt-0.5 h-5 w-5 rounded border-gray-300 accent-orange-500"
            />
            <label htmlFor="condition" className="text-sm text-amber-800">
              I confirm this item is unused, as described, and the listing is genuine.
            </label>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={submitting || loadingSellerProfile}
            className="hidden md:block w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold rounded-xl text-sm transition-colors"
          >
            {loadingSellerProfile ? "Loading seller profile..." : submitting ? "Submitting..." : "Submit listing for review"}
          </button>
        </form>
      </div>

      <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
        <div className="max-w-xl mx-auto bg-white/95 backdrop-blur border border-gray-200 rounded-2xl p-2 shadow-lg">
          <button
            type="submit"
            form="new-listing-form"
            disabled={submitting || loadingSellerProfile}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold rounded-xl text-sm transition-colors"
          >
            {loadingSellerProfile ? "Loading seller profile..." : submitting ? "Submitting..." : "Submit listing for review"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-gray-300 px-3.5 py-3 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent";
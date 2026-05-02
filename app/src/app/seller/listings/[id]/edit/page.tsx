"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, CITIES, MAX_IMAGE_SIZE_MB, MAX_IMAGES, TALUKAS } from "@/lib/constants";
import IdleLogout from "@/components/IdleLogout";
import { ImagePlus, X } from "lucide-react";

type ListingForm = {
  title: string;
  description: string;
  price: string;
  original_price: string;
  category: string;
  city: string;
  taluka: string;
  is_bulk: boolean;
  min_order_qty: string;
  bulk_price: string;
};

const INITIAL: ListingForm = {
  title: "",
  description: "",
  price: "",
  original_price: "",
  category: "",
  city: "",
  taluka: "",
  is_bulk: false,
  min_order_qty: "",
  bulk_price: "",
};

export default function SellerEditListingPage() {
  const params = useParams<{ id: string }>();
  const listingId = params?.id;
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ListingForm>(INITIAL);
  const [initialForm, setInitialForm] = useState<ListingForm>(INITIAL);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadListing() {
      if (!listingId) return;
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/seller/listings/${listingId}`);
        if (res.status === 401) {
          router.replace("/seller/login");
          return;
        }

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Unable to load listing.");
          return;
        }

        const listing = data.listing;
        const nextForm = {
          title: listing.title ?? "",
          description: listing.description ?? "",
          price: String(listing.price ?? ""),
          original_price: String(listing.original_price ?? ""),
          category: listing.category ?? "",
          city: listing.city ?? "",
          taluka: listing.taluka ?? "",
          is_bulk: Boolean(listing.is_bulk),
          min_order_qty: listing.min_order_qty ? String(listing.min_order_qty) : "",
          bulk_price: listing.bulk_price ? String(listing.bulk_price) : "",
        };

        setForm(nextForm);
        setInitialForm(nextForm);
        setExistingImageUrls(listing.image_urls ?? []);
      } catch {
        setError("Unable to load listing.");
      } finally {
        setLoading(false);
      }
    }

    loadListing();
  }, [listingId, router]);

  useEffect(() => {
    return () => {
      newImagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [newImagePreviews]);

  function setField(key: keyof ListingForm, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const remaining = MAX_IMAGES - (existingImageUrls.length + newImages.length);
    const toAdd = files.slice(0, remaining);
    const invalid = toAdd.filter((file) => file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024);

    if (invalid.length > 0) {
      setError(`Each image must be under ${MAX_IMAGE_SIZE_MB}MB`);
      return;
    }

    setNewImages((prev) => [...prev, ...toAdd]);
    setNewImagePreviews((prev) => [...prev, ...toAdd.map((file) => URL.createObjectURL(file))]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeExistingImage(index: number) {
    setExistingImageUrls((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  }

  function removeNewImage(index: number) {
    setNewImages((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
    setNewImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, currentIndex) => currentIndex !== index);
    });
  }

  async function uploadImages(): Promise<string[]> {
    const supabase = createClient();
    const urls: string[] = [];

    for (const file of newImages) {
      const ext = file.name.split(".").pop();
      const path = `public/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("listing-images")
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        throw new Error(`Image upload failed: ${uploadError.message}`);
      }

      const { data } = supabase.storage.from("listing-images").getPublicUrl(path);
      urls.push(data.publicUrl);
    }

    return urls;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!listingId) return;

    setError(null);
    setSuccess(null);

    const price = Number(form.price);
    const originalPrice = Number(form.original_price);
    if (!(price > 0) || !(originalPrice > 0) || !(price < originalPrice)) {
      setError("Sale price must be less than original price.");
      return;
    }

    if (existingImageUrls.length + newImages.length === 0) {
      setError("Please keep at least one image for the listing.");
      return;
    }

    setSubmitting(true);

    try {
      const uploadedImageUrls = await uploadImages();
      const imageUrls = [...existingImageUrls, ...uploadedImageUrls];

      const res = await fetch(`/api/seller/listings/${listingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          price,
          original_price: originalPrice,
          category: form.category,
          city: form.city,
          taluka: form.taluka || null,
          image_urls: imageUrls,
          is_bulk: form.is_bulk,
          min_order_qty: form.is_bulk && form.min_order_qty ? Number(form.min_order_qty) : null,
          bulk_price: form.is_bulk && form.bulk_price ? Number(form.bulk_price) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Update failed.");
        return;
      }

      setSuccess("Listing updated and sent for admin approval.");
      setTimeout(() => router.push("/seller/dashboard"), 1200);
    } catch {
      setError("Update failed.");
    } finally {
      setSubmitting(false);
    }
  }

  const availableTalukas = form.city ? (TALUKAS as Record<string, string[]>)[form.city] ?? [] : [];
  const changedFields = (Object.keys(form) as Array<keyof ListingForm>).filter((key) => form[key] !== initialForm[key]).length;
  const salePrice = Number(form.price || 0);
  const originalPrice = Number(form.original_price || 0);
  const hasValidDiscount = salePrice > 0 && originalPrice > 0 && originalPrice > salePrice;
  const discountPercent = hasValidDiscount ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) : null;
  const totalImages = existingImageUrls.length + newImages.length;

  return (
    <div data-seller-app-page="true" className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white py-8 px-4">
      <IdleLogout logoutEndpoint="/api/seller/logout" redirectTo="/seller/login" />
      <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Edit Listing</h1>
          <Link href="/seller/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            Back to dashboard
          </Link>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Your current details are already filled. Update only what you want to change.
        </p>

        <div className="mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
            <p className="text-xs text-gray-500">Changed fields</p>
            <p className="text-lg font-semibold text-gray-900">{changedFields}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
            <p className="text-xs text-gray-500">Sale price</p>
            <p className="text-lg font-semibold text-gray-900">{form.price ? `INR ${form.price}` : "-"}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
            <p className="text-xs text-gray-500">Discount</p>
            <p className="text-lg font-semibold text-green-700">{discountPercent !== null ? `${discountPercent}% off` : "-"}</p>
          </div>
        </div>

        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-6">
          After saving changes, this listing will move to pending status for admin review.
        </p>

        {loading ? (
          <p className="text-sm text-gray-500">Loading listing...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="rounded-xl border border-gray-200 p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Photos</h2>
              <p className="text-sm text-gray-500 mb-4">Keep clear product images. You can keep, remove, or add up to {MAX_IMAGES} images.</p>
              <div className="flex flex-wrap gap-3">
                {existingImageUrls.map((src, idx) => (
                  <div key={src} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                    <Image src={src} alt={`Existing image ${idx + 1}`} fill className="object-cover" sizes="96px" />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(idx)}
                      className="absolute top-1 right-1 bg-black/60 rounded-full p-1 text-white hover:bg-black"
                      aria-label={`Remove existing image ${idx + 1}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {newImagePreviews.map((src, idx) => (
                  <div key={src} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                    <Image src={src} alt={`New image ${idx + 1}`} fill className="object-cover" sizes="96px" unoptimized />
                    <button
                      type="button"
                      onClick={() => removeNewImage(idx)}
                      className="absolute top-1 right-1 bg-black/60 rounded-full p-1 text-white hover:bg-black"
                      aria-label={`Remove new image ${idx + 1}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {totalImages < MAX_IMAGES && (
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
            </section>

            <section className="rounded-xl border border-gray-200 p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Basic Information</h2>
              <div className="space-y-4">
                <Field label="Title" required>
                  <input value={form.title} onChange={(e) => setField("title", e.target.value)} className={inputCls} placeholder="Enter a clear title" required />
                </Field>

                <Field label="Description">
                  <textarea value={form.description} onChange={(e) => setField("description", e.target.value)} rows={4} className={inputCls} placeholder="Add key details, condition, size, brand, etc." />
                </Field>
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Price and Category</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Sale price (INR)" required>
                  <input type="number" min={1} step="0.01" value={form.price} onChange={(e) => setField("price", e.target.value)} className={inputCls} required />
                </Field>
                <Field label="Original price (INR)" required>
                  <input type="number" min={1} step="0.01" value={form.original_price} onChange={(e) => setField("original_price", e.target.value)} className={inputCls} required />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <Field label="Category" required>
                  <select value={form.category} onChange={(e) => setField("category", e.target.value)} className={inputCls} required>
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="City" required>
                  <select value={form.city} onChange={(e) => setField("city", e.target.value)} className={inputCls} required>
                    <option value="">Select city</option>
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Location Details</h2>
              {availableTalukas.length > 0 ? (
                <Field label="Taluka / Area">
                  <select value={form.taluka} onChange={(e) => setField("taluka", e.target.value)} className={inputCls}>
                    <option value="">Select taluka (optional)</option>
                    {availableTalukas.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
              ) : (
                <p className="text-sm text-gray-500">Select city first to choose a taluka.</p>
              )}
            </section>

            <section className="rounded-xl border border-gray-200 p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Bulk Deal (Optional)</h2>
              <div className="flex items-center gap-3">
                <input
                  id="is_bulk"
                  type="checkbox"
                  checked={form.is_bulk}
                  onChange={(e) => setField("is_bulk", e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 accent-orange-500"
                />
                <label htmlFor="is_bulk" className="text-sm font-medium text-gray-700">This is a bulk or lot deal</label>
              </div>

              {form.is_bulk && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <Field label="Min. order qty">
                    <input type="number" min={1} value={form.min_order_qty} onChange={(e) => setField("min_order_qty", e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Bulk price per unit (INR)">
                    <input type="number" min={1} step="0.01" value={form.bulk_price} onChange={(e) => setField("bulk_price", e.target.value)} className={inputCls} />
                  </Field>
                </div>
              )}
            </section>

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
            {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{success}</p>}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold py-2.5 rounded-lg transition-colors"
              >
                {submitting ? "Saving..." : "Save changes and submit for review"}
              </button>
              <Link
                href="/seller/dashboard"
                className="flex-1 inline-flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-lg transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
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
  "w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent";

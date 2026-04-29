"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CITIES, TALUKAS } from "@/lib/constants";

export default function SellerRegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    seller_name: "",
    username: "",
    phone: "",
    email: "",
    city: "",
    taluka: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const availableTalukas = form.city ? (TALUKAS as Record<string, string[]>)[form.city] ?? [] : [];

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/seller/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seller_name: form.seller_name,
          username: form.username,
          phone: form.phone,
          email: form.email,
          city: form.city,
          taluka: form.taluka,
          password: form.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed.");
        return;
      }

      setSuccess(data.message || "Registration submitted.");
      setTimeout(() => {
        router.push("/seller/login?pending=1");
      }, 1300);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-8">
          <div className="text-center mb-7">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Seller Registration</h1>
            <p className="text-sm text-gray-500">Create your account to list products on ZipDeals</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Store / Seller Name" value={form.seller_name} onChange={(v) => update("seller_name", v)} placeholder="Delux Furniture" required />
            <Input label="Username" value={form.username} onChange={(v) => update("username", v.toLowerCase())} placeholder="delux_furniture" required />
            <Input label="Phone" value={form.phone} onChange={(v) => update("phone", v)} placeholder="9876543210" required />
            <Input label="Recovery Email (optional)" value={form.email} onChange={(v) => update("email", v)} placeholder="owner@example.com" />

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
              <select
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Select city</option>
                {CITIES.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {availableTalukas.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Taluka</label>
                <select
                  value={form.taluka}
                  onChange={(e) => update("taluka", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select taluka (optional)</option>
                  {availableTalukas.map((taluka) => (
                    <option key={taluka} value={taluka}>{taluka}</option>
                  ))}
                </select>
              </div>
            )}

            <Input label="Password" type="password" value={form.password} onChange={(v) => update("password", v)} placeholder="At least 6 characters" required />
            <Input label="Confirm Password" type="password" value={form.confirmPassword} onChange={(v) => update("confirmPassword", v)} placeholder="Re-enter password" required />

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
            {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{success}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {loading ? "Submitting..." : "Register & submit for approval"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-5">
            Already registered?{" "}
            <Link href="/seller/login" className="text-orange-600 hover:text-orange-700 font-semibold">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
      />
    </div>
  );
}
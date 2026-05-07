"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CITIES, TALUKAS } from "@/lib/constants";

type FormState = {
  seller_name: string;
  username: string;
  phone: string;
  email: string;
  city: string;
  taluka: string;
  password: string;
  confirmPassword: string;
};

type FormKey = keyof FormState;

export default function SellerRegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
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
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FormKey, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<FormKey, boolean>>>({});
  const [usernameEdited, setUsernameEdited] = useState(false);

  const availableTalukas = form.city ? (TALUKAS as Record<string, string[]>)[form.city] ?? [] : [];

  function buildUsernameSuggestion(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 30);
  }

  function validateField(key: FormKey, value: string, current: FormState): string | null {
    switch (key) {
      case "seller_name":
        return value.trim().length >= 2 ? null : "Enter your store or seller name.";
      case "username":
        return /^[a-z0-9_]{3,30}$/.test(value)
          ? null
          : "Use 3-30 characters: lowercase letters, numbers, or underscore.";
      case "phone":
        return /^\d{10}$/.test(value) ? null : "Enter a valid 10-digit phone number.";
      case "email":
        if (!value.trim()) return null;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ? null
          : "Enter a valid recovery email address.";
      case "city":
        return value ? null : "Select your city.";
      case "password":
        return value.length >= 6 ? null : "Password must be at least 6 characters.";
      case "confirmPassword":
        return value === current.password ? null : "Passwords do not match.";
      case "taluka":
        return null;
      default:
        return null;
    }
  }

  function validateAll(current: FormState): Partial<Record<FormKey, string>> {
    const keys: FormKey[] = [
      "seller_name",
      "username",
      "phone",
      "email",
      "city",
      "password",
      "confirmPassword",
    ];

    const nextErrors: Partial<Record<FormKey, string>> = {};
    for (const key of keys) {
      const fieldError = validateField(key, current[key], current);
      if (fieldError) nextErrors[key] = fieldError;
    }
    return nextErrors;
  }

  function update(key: FormKey, value: string) {
    setError(null);
    setForm((prev) => {
      const next = { ...prev, [key]: value };

      if (key === "seller_name" && !usernameEdited) {
        next.username = buildUsernameSuggestion(value);
      }

      if (key === "city") {
        const nextTalukas = (TALUKAS as Record<string, string[]>)[value] ?? [];
        if (next.taluka && !nextTalukas.includes(next.taluka)) {
          next.taluka = "";
        }
      }

      setFieldErrors((prevErrors) => {
        const updated = { ...prevErrors };
        const fieldError = validateField(key, next[key], next);
        if (fieldError) updated[key] = fieldError;
        else delete updated[key];

        if (key === "seller_name" && !usernameEdited) {
          const usernameError = validateField("username", next.username, next);
          if (usernameError) updated.username = usernameError;
          else delete updated.username;
        }

        if (key === "password" || key === "confirmPassword") {
          const confirmError = validateField("confirmPassword", next.confirmPassword, next);
          if (confirmError) updated.confirmPassword = confirmError;
          else delete updated.confirmPassword;
        }

        return updated;
      });

      return next;
    });
  }

  function handleFieldBlur(key: FormKey) {
    setTouched((prev) => ({ ...prev, [key]: true }));
    const fieldError = validateField(key, form[key], form);
    setFieldErrors((prev) => {
      const updated = { ...prev };
      if (fieldError) updated[key] = fieldError;
      else delete updated[key];
      return updated;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const errors = validateAll(form);
    setTouched({
      seller_name: true,
      username: true,
      phone: true,
      email: true,
      city: true,
      password: true,
      confirmPassword: true,
      taluka: true,
    });
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError("Please fix the highlighted fields and try again.");
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Start selling stock faster on ZipDeals</h1>
            <p className="text-sm text-gray-500">Connect with direct buyers near you and move inventory quickly.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              id="seller_name"
              label="Store or seller name"
              value={form.seller_name}
              onChange={(v) => update("seller_name", v)}
              onBlur={() => handleFieldBlur("seller_name")}
              placeholder="e.g. Royal Furniture, Nanded"
              hint="Use the name buyers recognize."
              error={touched.seller_name ? fieldErrors.seller_name : undefined}
              autoComplete="organization"
              required
            />
            <Input
              id="username"
              label="Create your login name"
              value={form.username}
              onChange={(v) => {
                setUsernameEdited(true);
                update("username", v.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""));
              }}
              onBlur={() => handleFieldBlur("username")}
              placeholder="e.g. royal_furniture"
              hint="This will be used to login later (keep it simple). Use lowercase letters, numbers, and underscore only."
              error={touched.username ? fieldErrors.username : undefined}
              autoComplete="username"
              required
            />
            <Input
              id="phone"
              label="WhatsApp number"
              value={form.phone}
              onChange={(v) => update("phone", v.replace(/\D/g, "").slice(0, 10))}
              onBlur={() => handleFieldBlur("phone")}
              placeholder="e.g. 98765 43210"
              hint="Buyers contact you directly on this number."
              error={touched.phone ? fieldErrors.phone : undefined}
              autoComplete="tel"
              inputMode="numeric"
              maxLength={10}
              required
            />
            <Input
              id="email"
              label="Recovery email (optional)"
              value={form.email}
              onChange={(v) => update("email", v)}
              onBlur={() => handleFieldBlur("email")}
              placeholder="e.g. owner@royalfurniture.in"
              hint="Used only for password recovery."
              error={touched.email ? fieldErrors.email : undefined}
              autoComplete="email"
            />

            <div>
              <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">City</label>
              <select
                id="city"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                onBlur={() => handleFieldBlur("city")}
                required
                aria-invalid={Boolean(touched.city && fieldErrors.city)}
                aria-describedby="city_help"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Choose your city</option>
                {CITIES.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <p id="city_help" className="text-xs text-gray-500 mt-1">Choose where buyers can pick up or inspect products.</p>
              {touched.city && fieldErrors.city && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.city}</p>
              )}
            </div>

            {availableTalukas.length > 0 && (
              <div>
                <label htmlFor="taluka" className="block text-sm font-semibold text-gray-700 mb-2">Taluka (optional)</label>
                <select
                  id="taluka"
                  value={form.taluka}
                  onChange={(e) => update("taluka", e.target.value)}
                  aria-describedby="taluka_help"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Choose your taluka</option>
                  {availableTalukas.map((taluka) => (
                    <option key={taluka} value={taluka}>{taluka}</option>
                  ))}
                </select>
                <p id="taluka_help" className="text-xs text-gray-500 mt-1">Helps nearby buyers discover your listings faster.</p>
              </div>
            )}

            <Input
              id="password"
              label="Password"
              type="password"
              value={form.password}
              onChange={(v) => update("password", v)}
              onBlur={() => handleFieldBlur("password")}
              placeholder="Create a password you'll remember"
              hint="Use at least 6 characters for account security."
              error={touched.password ? fieldErrors.password : undefined}
              autoComplete="new-password"
              required
            />
            <Input
              id="confirmPassword"
              label="Confirm password"
              type="password"
              value={form.confirmPassword}
              onChange={(v) => update("confirmPassword", v)}
              onBlur={() => handleFieldBlur("confirmPassword")}
              placeholder="Enter the same password again"
              error={touched.confirmPassword ? fieldErrors.confirmPassword : undefined}
              autoComplete="new-password"
              required
            />

            {error && <p role="alert" aria-live="assertive" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
            {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{success}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {loading ? "Submitting..." : "Start selling your stock"}
            </button>

            <p className="text-center text-xs text-gray-500">No upfront cost • Direct buyers • Takes 2 minutes</p>
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
  id,
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  hint,
  error,
  type = "text",
  required = false,
  autoComplete,
  inputMode,
  maxLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
}) {
  const hintId = `${id}_hint`;
  const errorId = `${id}_error`;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
        aria-describedby={`${hint ? hintId : ""}${hint && error ? " " : ""}${error ? errorId : ""}`.trim() || undefined}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
      />
      {hint && <p id={hintId} className="text-xs text-gray-500 mt-1">{hint}</p>}
      {error && <p id={errorId} className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
"use client";

import { useState } from "react";
import Link from "next/link";

export default function SellerForgotPasswordPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("/api/seller/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not process your request.");
        return;
      }

      setSuccess(data.message || "If your account exists, a reset link has been sent.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not process your request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot password</h1>
          <p className="text-sm text-gray-600 mb-6">Enter your registered phone number. If recovery email exists, we will send reset instructions.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Registered phone number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
            {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{success}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {loading ? "Checking..." : "Send reset link"}
            </button>
          </form>

          <p className="text-sm text-gray-600 mt-5">
            Remembered your password?{" "}
            <Link href="/seller/login" className="text-orange-600 hover:text-orange-700 font-semibold">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

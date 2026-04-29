"use client";

import { useState } from "react";

interface Props {
  initialEmail: string | null;
}

export default function SellerRecoveryEmailCard({ initialEmail }: Props) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [savedEmail, setSavedEmail] = useState(initialEmail ?? "");
  const [editing, setEditing] = useState(!initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isMissing = !savedEmail;

  async function saveEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/seller/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save recovery email.");
        return;
      }

      setSavedEmail(data.email || "");
      setEmail(data.email || "");
      setEditing(false);
      setSuccess("Recovery email saved. Password reset will now work for your account.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save recovery email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`mb-6 rounded-lg border p-4 ${
        isMissing ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"
      }`}
    >
      <p className={`text-sm font-semibold ${isMissing ? "text-red-800" : "text-green-800"}`}>
        {isMissing ? "Recovery email missing" : "Recovery email configured"}
      </p>
      <p className={`text-xs mt-1 ${isMissing ? "text-red-700" : "text-green-700"}`}>
        {isMissing
          ? "Add a recovery email now to avoid account lockout if you forget your password."
          : "Your reset emails will be sent to this address."}
      </p>

      {savedEmail && !editing && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-sm text-gray-800 break-all">{savedEmail}</p>
          <button
            type="button"
            onClick={() => {
              setEditing(true);
              setSuccess(null);
              setError(null);
            }}
            className="px-3 py-1.5 text-xs font-semibold rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Change
          </button>
        </div>
      )}

      {(editing || !savedEmail) && (
        <form className="mt-3 flex flex-col sm:flex-row gap-2" onSubmit={saveEmail}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="owner@example.com"
            required
            className="flex-1 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-md text-sm font-semibold bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white"
          >
            {loading ? "Saving..." : "Save email"}
          </button>
        </form>
      )}

      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
      {success && <p className="mt-2 text-xs text-green-700">{success}</p>}
    </div>
  );
}

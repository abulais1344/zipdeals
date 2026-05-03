"use client";

import { useState } from "react";

type RequestStatus = "pending" | "processing" | "completed" | "rejected" | "cancelled";

interface DeletionRequestInfo {
  id: string;
  status: RequestStatus;
  reason: string | null;
  requested_at: string;
  reviewed_at?: string | null;
  reviewer_note?: string | null;
}

interface Props {
  initialRequest: DeletionRequestInfo | null;
}

function formatStatus(status: RequestStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusClass(status: RequestStatus): string {
  if (status === "pending") return "bg-yellow-100 text-yellow-800";
  if (status === "processing") return "bg-blue-100 text-blue-800";
  if (status === "completed") return "bg-green-100 text-green-800";
  if (status === "rejected") return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-800";
}

export default function DeleteAccountRequestCard({ initialRequest }: Props) {
  const [request, setRequest] = useState<DeletionRequestInfo | null>(initialRequest);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const hasActiveRequest = request?.status === "pending" || request?.status === "processing";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/seller/deletion-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      const payload = (await response.json()) as {
        error?: string;
        request?: DeletionRequestInfo;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Failed to submit deletion request.");
      }

      if (payload.request) {
        setRequest(payload.request);
      }
      setReason("");
      setMessage("Deletion request submitted. Our team will review and contact you if needed.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit deletion request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-xl border border-red-200 bg-red-50/40 p-4 sm:p-5">
      <h2 className="text-base font-semibold text-gray-900">Delete My Account/Data</h2>
      <p className="mt-1 text-sm text-gray-600">
        Use this if you want to permanently request account and personal data deletion.
      </p>

      {request && (
        <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3 text-sm">
          <p className="flex items-center gap-2 text-gray-700">
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(request.status)}`}>
              {formatStatus(request.status)}
            </span>
            <span>Requested on {new Date(request.requested_at).toLocaleDateString("en-IN")}</span>
          </p>
          {request.reason && <p className="mt-2 text-gray-600">Reason: {request.reason}</p>}
          {request.reviewer_note && <p className="mt-2 text-gray-600">Review note: {request.reviewer_note}</p>}
        </div>
      )}

      {hasActiveRequest ? (
        <p className="mt-3 text-sm font-medium text-gray-700">
          You already have an active deletion request. You can submit a new one after this request is resolved.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-gray-700" htmlFor="deletion-reason">
            Reason (optional)
          </label>
          <textarea
            id="deletion-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 1000))}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            placeholder="Tell us why you want to delete your account/data"
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-gray-500">This request is irreversible once approved.</p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Submitting..." : "Request Deletion"}
            </button>
          </div>
        </form>
      )}

      {error && <p className="mt-3 text-sm font-medium text-red-700">{error}</p>}
      {message && <p className="mt-3 text-sm font-medium text-green-700">{message}</p>}
    </section>
  );
}

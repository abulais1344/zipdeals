import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, UserCircle2 } from "lucide-react";
import { getSellerSession } from "@/lib/seller-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import SellerLogoutButton from "@/components/SellerLogoutButton";
import IdleLogout from "@/components/IdleLogout";
import DeleteAccountRequestCard from "@/components/seller/DeleteAccountRequestCard";

interface SellerAccountProfile {
  id: string;
  seller_name: string;
  username: string;
  phone: string;
  email: string | null;
  created_at: string;
}

interface SellerDeletionRequest {
  id: string;
  status: "pending" | "processing" | "completed" | "rejected" | "cancelled";
  reason: string | null;
  requested_at: string;
  reviewed_at?: string | null;
  reviewer_note?: string | null;
}

function isMissingDeletionTable(message: string | undefined): boolean {
  return (message ?? "").includes("seller_data_deletion_requests");
}

export default async function SellerAccountPage() {
  const session = await getSellerSession();

  if (!session) {
    redirect("/seller/login");
  }

  const supabase = createAdminClient();

  const { data: seller, error: sellerError } = await supabase
    .from("sellers")
    .select("id, seller_name, username, phone, email, created_at")
    .eq("id", session.seller_id)
    .single();

  if (sellerError || !seller) {
    redirect("/seller/dashboard");
  }

  const { data: requestData, error: requestError } = await supabase
    .from("seller_data_deletion_requests")
    .select("id, status, reason, requested_at, reviewed_at, reviewer_note")
    .eq("seller_id", session.seller_id)
    .order("requested_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const latestRequest = requestError
    ? isMissingDeletionTable(requestError.message)
      ? null
      : null
    : ((requestData ?? null) as SellerDeletionRequest | null);

  const profile = seller as SellerAccountProfile;

  return (
    <div data-seller-app-page="true" className="min-h-screen bg-gray-50">
      <IdleLogout logoutEndpoint="/api/seller/logout" redirectTo="/seller/login" />

      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-orange-600">
              <UserCircle2 size={20} />
            </span>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Account Details</h1>
              <p className="text-sm text-gray-500">Manage your seller account and privacy requests</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/seller/dashboard"
              className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              <ArrowLeft size={16} />
              Dashboard
            </Link>
            <SellerLogoutButton />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
          <h2 className="text-base font-semibold text-gray-900">Profile</h2>
          <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-gray-500">Seller name</dt>
              <dd className="font-medium text-gray-900">{profile.seller_name}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Username</dt>
              <dd className="font-medium text-gray-900">{profile.username}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Phone</dt>
              <dd className="font-medium text-gray-900">{profile.phone}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Email</dt>
              <dd className="font-medium text-gray-900">{profile.email ?? "Not set"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Joined</dt>
              <dd className="font-medium text-gray-900">{new Date(profile.created_at).toLocaleDateString("en-IN")}</dd>
            </div>
          </dl>
        </section>

        <DeleteAccountRequestCard initialRequest={latestRequest} />
      </div>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function MarkSoldPage({ params }: Props) {
  const { token } = await params;

  // Validate UUID format before passing to DB
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(token)) {
    return <Result success={false} message="Invalid link." />;
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any).rpc("mark_listing_sold", { token });

  const success = data === "success";
  const message =
    data === "success"
      ? "Your listing has been marked as sold."
      : "This listing is already sold, expired, or the link is invalid.";

  return <Result success={success} message={message} />;
}

function Result({ success, message }: { success: boolean; message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-sm w-full text-center bg-white rounded-2xl border border-gray-100 shadow-sm p-10">
        {success ? (
          <CheckCircle className="mx-auto text-green-500 mb-4" size={52} />
        ) : (
          <XCircle className="mx-auto text-red-400 mb-4" size={52} />
        )}
        <h1 className="text-lg font-bold text-gray-900 mb-2">
          {success ? "Marked as sold!" : "Couldn't update listing"}
        </h1>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <Link
          href="/"
          className="inline-block py-2 px-6 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg text-sm transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

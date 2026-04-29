import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function SuccessPage() {
  return (
    <div data-seller-app-page="true" className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-sm w-full text-center bg-white rounded-2xl border border-gray-100 shadow-sm p-10">
        <CheckCircle className="mx-auto text-green-500 mb-4" size={52} />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Listing submitted!</h1>
        <p className="text-sm text-gray-500 mb-6">
          We&apos;ll review and activate your listing within a few hours. You&apos;ll get a WhatsApp
          message with a link to mark it as sold once it goes live.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/sell/new"
            className="py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg text-sm transition-colors"
          >
            List another item
          </Link>
          <Link
            href="/"
            className="py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium rounded-lg text-sm transition-colors"
          >
            Browse deals
          </Link>
        </div>
      </div>
    </div>
  );
}

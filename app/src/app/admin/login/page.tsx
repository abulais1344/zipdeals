import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { adminSessionCookieName, verifyAdminSessionCookie } from "@/lib/admin-session";

interface Props {
  searchParams: Promise<{ error?: string }>;
}

const errorMessages: Record<string, string> = {
  invalid: "Invalid admin ID or password.",
  missing: "Enter both admin ID and password.",
};

export default async function AdminLoginPage({ searchParams }: Props) {
  const cookieStore = await cookies();
  const session = verifyAdminSessionCookie(cookieStore.get(adminSessionCookieName)?.value);

  if (session) {
    const headersList = await headers();
    const host = headersList.get("host") ?? "localhost:3000";
    const proto = process.env.NODE_ENV === "production" ? "https" : "http";
    redirect(`${proto}://${host}/admin/pending`);
  }

  const { error } = await searchParams;
  const errorMessage = error ? errorMessages[error] ?? "Unable to sign in." : null;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <div className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-semibold tracking-wide">
          ZipDeals Admin Console
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
        <p className="text-sm text-gray-500 mt-1">Use your admin ID and password to review listings.</p>

        <form action="/api/admin/login" method="post" className="mt-6 space-y-4">
          <div>
            <label htmlFor="loginId" className="block text-sm font-medium text-gray-700 mb-1">
              Admin ID
            </label>
            <input
              id="loginId"
              name="loginId"
              type="text"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              placeholder="admin"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

          <button
            type="submit"
            className="w-full px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}

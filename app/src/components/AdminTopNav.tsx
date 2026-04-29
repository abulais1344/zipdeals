import Link from "next/link";
import IdleLogout from "@/components/IdleLogout";

interface Props {
  current: "pending" | "active" | "analytics" | "sellers" | "schema";
}

const links: Array<{ key: Props["current"]; label: string; href: string }> = [
  { key: "pending", label: "Pending", href: "/admin/pending" },
  { key: "active", label: "Active", href: "/admin/active" },
  { key: "analytics", label: "Analytics", href: "/admin/analytics" },
  { key: "sellers", label: "Sellers", href: "/admin/sellers" },
  { key: "schema", label: "Schema", href: "/admin/schema" },
];

export default function AdminTopNav({ current }: Props) {
  return (
    <div className="mb-5 rounded-xl border border-slate-200 bg-white px-3 py-3 sm:px-4">
      <IdleLogout logoutEndpoint="/api/admin/logout" redirectTo="/admin/login" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-semibold tracking-wide">
          ZipDeals Admin Console
        </div>

        <form action="/api/admin/logout" method="post">
          <button
            type="submit"
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Logout
          </button>
        </form>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {links.map((link) => {
          const active = link.key === current;
          return (
            <Link
              key={link.key}
              href={link.href}
              className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium border transition-colors ${
                active
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

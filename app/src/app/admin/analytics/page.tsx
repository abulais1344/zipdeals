import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/admin-auth";
import AdminTopNav from "@/components/AdminTopNav";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ rollout?: string; range?: string }>;
}

type EventCountOptions = {
  eventType: "view" | "whatsapp_click" | "report" | "seller_profile_click";
  isMobile?: boolean;
  source?: string;
  gte?: string;
  lt?: string;
};

type EventRow = {
  event_type: "view" | "whatsapp_click" | "report" | "seller_profile_click";
  city: string | null;
  created_at: string;
  event_context: Record<string, unknown> | null;
};

type RangeDays = 7 | 30 | 90;

function parseRange(input: string | undefined): RangeDays {
  if (input === "7") return 7;
  if (input === "90") return 90;
  return 30;
}

function getContextString(context: Record<string, unknown> | null, key: string): string | null {
  if (!context) return null;
  const value = context[key];
  return typeof value === "string" ? value : null;
}

function getContextBoolean(context: Record<string, unknown> | null, key: string): boolean | null {
  if (!context) return null;
  const value = context[key];
  return typeof value === "boolean" ? value : null;
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

function buildQuery(range: RangeDays, rollout?: string): string {
  const params = new URLSearchParams({ range: String(range) });
  if (rollout) params.set("rollout", rollout);
  return `/admin/analytics?${params.toString()}`;
}

async function countEvents(options: EventCountOptions): Promise<number> {
  const supabase = createAdminClient();
  let query = supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("event_type", options.eventType);

  if (options.gte) query = query.gte("created_at", options.gte);
  if (options.lt) query = query.lt("created_at", options.lt);
  if (options.source) query = query.contains("event_context", { source: options.source });
  if (typeof options.isMobile === "boolean") {
    query = query.contains("event_context", { is_mobile: options.isMobile });
  }

  const { count, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

function pct(part: number, whole: number): string {
  if (!whole) return "0.00";
  return ((part / whole) * 100).toFixed(2);
}

function getRolloutDate(input: string | undefined): Date {
  const fallback = new Date("2026-04-29T00:00:00.000Z");
  if (!input) return fallback;
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed;
}

function MetricCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}

function Sparkline({ points, label }: { points: number[]; label: string }) {
  const width = 140;
  const height = 42;
  const padding = 3;
  const max = Math.max(...points, 1);
  const denominator = Math.max(points.length - 1, 1);

  const polylinePoints = points
    .map((value, index) => {
      const x = padding + (index * (width - padding * 2)) / denominator;
      const y = height - padding - (value / max) * (height - padding * 2);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <div className="mt-3">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-11 w-full max-w-[150px]"
        role="img"
        aria-label={label}
      >
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="rgb(249 115 22)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default async function AdminAnalyticsPage({ searchParams }: Props) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const rangeDays = parseRange(params.range);
  const nowIso = new Date().toISOString();
  const rangeStart = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000);
  const rangeStartIso = rangeStart.toISOString();
  const last60Iso = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
  const rolloutDate = getRolloutDate(params.rollout);
  const rolloutIso = rolloutDate.toISOString();

  let viewsMobile = 0;
  let viewsDesktop = 0;
  let sellerClicksMobile = 0;
  let sellerClicksDesktop = 0;
  let whatsappStickyMobile = 0;
  let whatsappInlineMobile = 0;
  let mobileCtrTrend: number[] = [];
  let desktopCtrTrend: number[] = [];
  let stickyLiftTrend: number[] = [];
  let cityRows: Array<{ city: string; views: number; sellerClicks: number; whatsappClicks: number; ctr: number }> = [];
  let viewsBefore = 0;
  let viewsAfter = 0;
  let sellerClicksBefore = 0;
  let sellerClicksAfter = 0;
  let whatsappBefore = 0;
  let whatsappAfter = 0;
  let stickyLiftPct = "0.00";
  let errorMessage: string | null = null;

  try {
    const supabase = createAdminClient();
    const { data: rawEvents, error: eventsError } = await supabase
      .from("events")
      .select("event_type, city, created_at, event_context")
      .gte("created_at", rangeStartIso)
      .lt("created_at", nowIso)
      .order("created_at", { ascending: true });

    if (eventsError) {
      throw new Error(eventsError.message);
    }

    const events = (rawEvents ?? []) as EventRow[];
    const dayCount = Math.min(rangeDays, 30);
    const trendStart = startOfDay(new Date(Date.now() - (dayCount - 1) * 24 * 60 * 60 * 1000));

    const dailyViewsMobile = new Array(dayCount).fill(0) as number[];
    const dailyViewsDesktop = new Array(dayCount).fill(0) as number[];
    const dailySellerClicksMobile = new Array(dayCount).fill(0) as number[];
    const dailySellerClicksDesktop = new Array(dayCount).fill(0) as number[];
    const dailyWhatsappStickyMobile = new Array(dayCount).fill(0) as number[];
    const dailyWhatsappInlineMobile = new Array(dayCount).fill(0) as number[];

    const byCity = new Map<string, { views: number; sellerClicks: number; whatsappClicks: number }>();

    const incCity = (cityValue: string, field: "views" | "sellerClicks" | "whatsappClicks") => {
      const current = byCity.get(cityValue) ?? { views: 0, sellerClicks: 0, whatsappClicks: 0 };
      current[field] += 1;
      byCity.set(cityValue, current);
    };

    for (const event of events) {
      const source = getContextString(event.event_context, "source");
      const isMobile = getContextBoolean(event.event_context, "is_mobile");
      const city = (event.city || "Unknown").trim() || "Unknown";

      const eventDate = new Date(event.created_at);
      const dayIndex = Math.floor((startOfDay(eventDate).getTime() - trendStart.getTime()) / (24 * 60 * 60 * 1000));
      const isTrendWindow = dayIndex >= 0 && dayIndex < dayCount;

      if (event.event_type === "view" && source === "listing_detail") {
        incCity(city, "views");
        if (isMobile === true) {
          if (isTrendWindow) dailyViewsMobile[dayIndex] += 1;
        } else if (isMobile === false) {
          if (isTrendWindow) dailyViewsDesktop[dayIndex] += 1;
        }
      }

      if (event.event_type === "seller_profile_click") {
        incCity(city, "sellerClicks");
        if (isMobile === true) {
          if (isTrendWindow) dailySellerClicksMobile[dayIndex] += 1;
        } else if (isMobile === false) {
          if (isTrendWindow) dailySellerClicksDesktop[dayIndex] += 1;
        }
      }

      if (event.event_type === "whatsapp_click") {
        incCity(city, "whatsappClicks");
        if (isMobile === true && source === "listing_detail_sticky_mobile" && isTrendWindow) {
          dailyWhatsappStickyMobile[dayIndex] += 1;
        }
        if (isMobile === true && source === "listing_detail_inline" && isTrendWindow) {
          dailyWhatsappInlineMobile[dayIndex] += 1;
        }
      }
    }

    viewsMobile = dailyViewsMobile.reduce((sum, value) => sum + value, 0);
    viewsDesktop = dailyViewsDesktop.reduce((sum, value) => sum + value, 0);
    sellerClicksMobile = dailySellerClicksMobile.reduce((sum, value) => sum + value, 0);
    sellerClicksDesktop = dailySellerClicksDesktop.reduce((sum, value) => sum + value, 0);
    whatsappStickyMobile = dailyWhatsappStickyMobile.reduce((sum, value) => sum + value, 0);
    whatsappInlineMobile = dailyWhatsappInlineMobile.reduce((sum, value) => sum + value, 0);

    mobileCtrTrend = dailyViewsMobile.map((views, idx) => (views ? (dailySellerClicksMobile[idx] / views) * 100 : 0));
    desktopCtrTrend = dailyViewsDesktop.map((views, idx) => (views ? (dailySellerClicksDesktop[idx] / views) * 100 : 0));
    stickyLiftTrend = dailyWhatsappInlineMobile.map((inline, idx) => {
      if (!inline) return 0;
      return ((dailyWhatsappStickyMobile[idx] - inline) / inline) * 100;
    });

    cityRows = Array.from(byCity.entries())
      .map(([city, values]) => ({
        city,
        views: values.views,
        sellerClicks: values.sellerClicks,
        whatsappClicks: values.whatsappClicks,
        ctr: values.views ? (values.sellerClicks / values.views) * 100 : 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    [
      viewsBefore,
      viewsAfter,
      sellerClicksBefore,
      sellerClicksAfter,
      whatsappBefore,
      whatsappAfter,
    ] = await Promise.all([
      countEvents({ eventType: "view", gte: last60Iso, lt: rolloutIso }),
      countEvents({ eventType: "view", gte: rolloutIso, lt: nowIso }),
      countEvents({ eventType: "seller_profile_click", gte: last60Iso, lt: rolloutIso }),
      countEvents({ eventType: "seller_profile_click", gte: rolloutIso, lt: nowIso }),
      countEvents({ eventType: "whatsapp_click", gte: last60Iso, lt: rolloutIso }),
      countEvents({ eventType: "whatsapp_click", gte: rolloutIso, lt: nowIso }),
    ]);

    stickyLiftPct = whatsappInlineMobile > 0
      ? (((whatsappStickyMobile - whatsappInlineMobile) / whatsappInlineMobile) * 100).toFixed(2)
      : "0.00";
  } catch (err: unknown) {
    errorMessage = err instanceof Error ? err.message : "Unknown error";
  }

  if (errorMessage) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <AdminTopNav current="analytics" />
        <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-semibold tracking-wide">
          ZipDeals Admin
        </span>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-red-600 mt-2">Failed to load analytics: {errorMessage}</p>
        <p className="text-sm text-gray-600 mt-2">
          Ensure the latest analytics migration was executed in Supabase SQL editor.
        </p>
        <div className="mt-4">
          <Link href="/admin/pending" className="text-sm text-orange-600 hover:text-orange-700">Back to pending queue</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <AdminTopNav current="analytics" />
      <div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Mobile-first engagement KPIs from tracked events. Rollout baseline: {rolloutDate.toISOString().slice(0, 10)}
          </p>
          <div className="mt-3 inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
            {[7, 30, 90].map((value) => {
              const active = rangeDays === value;
              return (
                <Link
                  key={value}
                  href={buildQuery(value as RangeDays, params.rollout)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                    active
                      ? "bg-white text-orange-700 shadow-sm"
                      : "text-gray-600 hover:bg-white hover:text-gray-800"
                  }`}
                >
                  {value}d
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title={`Seller Profile CTR (Mobile, ${rangeDays}d)`}
          value={`${pct(sellerClicksMobile, viewsMobile)}%`}
          subtitle={`${sellerClicksMobile} clicks / ${viewsMobile} listing views`}
        />
        <MetricCard
          title={`Seller Profile CTR (Desktop, ${rangeDays}d)`}
          value={`${pct(sellerClicksDesktop, viewsDesktop)}%`}
          subtitle={`${sellerClicksDesktop} clicks / ${viewsDesktop} listing views`}
        />
        <MetricCard
          title={`Sticky WhatsApp Lift (Mobile, ${rangeDays}d)`}
          value={`${stickyLiftPct}%`}
          subtitle={`Sticky ${whatsappStickyMobile} vs Inline ${whatsappInlineMobile}`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Mobile CTR Trend</p>
          <Sparkline points={mobileCtrTrend} label="Mobile seller profile CTR trend" />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Desktop CTR Trend</p>
          <Sparkline points={desktopCtrTrend} label="Desktop seller profile CTR trend" />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Sticky Lift Trend</p>
          <Sparkline points={stickyLiftTrend} label="Mobile sticky WhatsApp lift trend" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-base font-semibold text-gray-900">Mobile WhatsApp Source Breakdown</h2>
          <p className="text-xs text-gray-500 mt-1">Last {rangeDays} days</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Sticky CTA</span>
              <span className="font-semibold text-gray-900">{whatsappStickyMobile}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Inline CTA</span>
              <span className="font-semibold text-gray-900">{whatsappInlineMobile}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-base font-semibold text-gray-900">City-wise KPI Breakdown</h2>
          <p className="text-xs text-gray-500 mt-1">Top cities by listing-detail views in last {rangeDays} days</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-2 pr-4">City</th>
                  <th className="pb-2 pr-4">Views</th>
                  <th className="pb-2 pr-4">Seller Clicks</th>
                  <th className="pb-2 pr-4">CTR</th>
                  <th className="pb-2">WhatsApp</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {cityRows.length > 0 ? (
                  cityRows.map((row) => (
                    <tr key={row.city}>
                      <td className="py-2 pr-4">{row.city}</td>
                      <td className="py-2 pr-4">{row.views}</td>
                      <td className="py-2 pr-4">{row.sellerClicks}</td>
                      <td className="py-2 pr-4">{row.ctr.toFixed(2)}%</td>
                      <td className="py-2">{row.whatsappClicks}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-3 text-gray-500">No city data in selected range.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="text-base font-semibold text-gray-900">Before vs After Rollout</h2>
        <p className="text-xs text-gray-500 mt-1">Compared in last 60 days</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-2 pr-4">Metric</th>
                <th className="pb-2 pr-4">Before</th>
                <th className="pb-2">After</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              <tr>
                <td className="py-2 pr-4">Listing views</td>
                <td className="py-2 pr-4">{viewsBefore}</td>
                <td className="py-2">{viewsAfter}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Seller profile clicks</td>
                <td className="py-2 pr-4">{sellerClicksBefore}</td>
                <td className="py-2">{sellerClicksAfter}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">WhatsApp clicks</td>
                <td className="py-2 pr-4">{whatsappBefore}</td>
                <td className="py-2">{whatsappAfter}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Tip: add query param rollout to compare from a specific date, e.g. /admin/analytics?rollout=2026-04-29T00:00:00Z
      </p>
    </div>
  );
}

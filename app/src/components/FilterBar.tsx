"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CATEGORIES, CITIES, TALUKAS } from "@/lib/constants";
import { Suspense, useState, useEffect, useRef } from "react";
import { Search, X, SlidersHorizontal, ArrowUpDown, MapPin, Tag, IndianRupee } from "lucide-react";

interface Props {
  selectedCity: string | null;
  selectedCategory: string | null;
  selectedTaluka: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  searchQuery: string | null;
  sortBy: string | null;
}

const SORT_OPTIONS = [
  { value: "newest",   label: "Newest first",       icon: "🕐" },
  { value: "cheapest", label: "Price: Low → High",   icon: "↑₹" },
  { value: "expensive",label: "Price: High → Low",   icon: "↓₹" },
  { value: "discount", label: "Highest discount",    icon: "🏷️" },
];

function FilterBarInner({ selectedCity, selectedCategory, selectedTaluka, minPrice, maxPrice, searchQuery, sortBy }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState(() => searchQuery ?? "");
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const timer = setTimeout(() => {
      const sp = new URLSearchParams(window.location.search);
      if (search.trim()) { sp.set("q", search.trim()); } else { sp.delete("q"); }
      sp.delete("page");
      router.push(`${pathname}?${sp.toString()}`);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function updateFilter(key: string, value: string, clearAdditionalKeys: string[] = []) {
    const sp = new URLSearchParams(searchParams.toString());
    if (value) { sp.set(key, value); } else { sp.delete(key); }
    clearAdditionalKeys.forEach(k => sp.delete(k));
    sp.delete("page");
    router.push(`${pathname}?${sp.toString()}`);
  }

  function removeFilter(key: string) { updateFilter(key, ""); }

  function clearAllFilters() { router.push(pathname); setSearch(""); }

  const availableTalukas = selectedCity && (TALUKAS as Record<string, string[]>)[selectedCity]
    ? (TALUKAS as Record<string, string[]>)[selectedCity] : [];

  // Active filter chips
  const activeFilters: { label: string; key: string }[] = [];
  if (selectedCity) activeFilters.push({ label: selectedCity, key: "city" });
  if (selectedTaluka) activeFilters.push({ label: selectedTaluka, key: "taluka" });
  if (selectedCategory) activeFilters.push({ label: selectedCategory, key: "category" });
  if (minPrice !== null) activeFilters.push({ label: `Min ₹${minPrice.toLocaleString("en-IN")}`, key: "minPrice" });
  if (maxPrice !== null) activeFilters.push({ label: `Max ₹${maxPrice.toLocaleString("en-IN")}`, key: "maxPrice" });
  if (searchQuery) activeFilters.push({ label: `"${searchQuery}"`, key: "q" });

  const activeSortLabel = SORT_OPTIONS.find(s => s.value === (sortBy ?? "newest"))?.label ?? "Newest first";
  const hasFilters = activeFilters.length > 0;

  return (
    <div className="space-y-2">
      {/* Row 1: Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search products, brands, categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-xl pl-10 pr-10 py-3 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-shadow placeholder:text-gray-400"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Row 2: Filters + Sort side by side */}
      <div className="flex gap-2">
        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium shadow-sm transition-all ${
            showFilters || hasFilters
              ? "bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
          }`}
        >
          <SlidersHorizontal size={15} />
          <span>Filters</span>
          {hasFilters && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
              showFilters ? "bg-white text-orange-500" : "bg-orange-500 text-white"
            }`}>
              {activeFilters.length}
            </span>
          )}
        </button>

        {/* Sort Dropdown */}
        <div className="relative flex-1">
          <select
            value={sortBy ?? "newest"}
            onChange={(e) => updateFilter("sort", e.target.value)}
            className="appearance-none w-full px-4 py-2.5 pr-9 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 shadow-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent cursor-pointer transition-all"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ArrowUpDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Expandable Filter Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-md p-3 sm:p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* City */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <MapPin size={12} />
                City
              </label>
              <select
                value={selectedCity ?? ""}
                onChange={(e) => updateFilter("city", e.target.value, e.target.value !== selectedCity ? ["taluka"] : [])}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
              >
                <option value="">All cities</option>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Taluka (only when city has talukas) */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <MapPin size={12} />
                Taluka
              </label>
              <select
                value={selectedTaluka ?? ""}
                onChange={(e) => updateFilter("taluka", e.target.value)}
                disabled={availableTalukas.length === 0}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="">{availableTalukas.length === 0 ? "Select a city first" : "All talukas"}</option>
                {availableTalukas.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <Tag size={12} />
                Category
              </label>
              <select
                value={selectedCategory ?? ""}
                onChange={(e) => updateFilter("category", e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
              >
                <option value="">All categories</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Price Range */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <IndianRupee size={12} />
                Price Range
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice ?? ""}
                  onChange={(e) => updateFilter("minPrice", e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                />
                <span className="text-gray-400 text-sm shrink-0">—</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice ?? ""}
                  onChange={(e) => updateFilter("maxPrice", e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Active Filter Chips */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-400 font-medium">Active:</span>
          {activeFilters.map(({ label, key }) => (
            <button
              key={key}
              onClick={() => key === "q" ? (setSearch(""), removeFilter("q")) : removeFilter(key)}
              className="inline-flex items-center gap-1.5 text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-full hover:bg-orange-100 transition-colors group"
            >
              {label}
              <X size={11} className="opacity-60 group-hover:opacity-100" />
            </button>
          ))}
          <button
            onClick={clearAllFilters}
            className="text-xs text-gray-400 hover:text-gray-600 underline-offset-2 hover:underline transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

export default function FilterBar(props: Props) {
  return (
    <Suspense>
      <FilterBarInner {...props} />
    </Suspense>
  );
}

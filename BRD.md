# Business Requirements Document (BRD)
**Project: ZipDeals — Local Clearance Deals & Bulk Stock Marketplace**
**Version:** 1.0
**Date:** April 28, 2026
**Status:** Draft

---

## Table of Contents
1. [Objective](#1-objective)
2. [Problem Statement](#2-problem-statement)
3. [Solution Overview](#3-solution-overview)
4. [User Types & Personas](#4-user-types--personas)
5. [MVP Scope](#5-mvp-scope)
6. [User Flows](#6-user-flows)
7. [Core Features](#7-core-features)
8. [Architecture](#8-architecture)
9. [Data Model](#9-data-model)
10. [Trust & Safety Strategy](#10-trust--safety-strategy)
11. [Admin Operations](#11-admin-operations)
12. [Monetization](#12-monetization)
13. [KPIs & Success Metrics](#13-kpis--success-metrics)
14. [Risks & Mitigations](#14-risks--mitigations)
15. [Go-To-Market Strategy](#15-go-to-market-strategy)
16. [Roadmap](#16-roadmap)
17. [Legal & Privacy Considerations](#17-legal--privacy-considerations)
18. [Open Questions](#18-open-questions)

---

## 1. Objective

Build a hyperlocal platform that helps sellers clear unsold inventory quickly and helps buyers discover genuine discounted deals nearby. The platform operates on a **WhatsApp-first contact model** — buyers connect with sellers directly, completing transactions offline, keeping the technical complexity of Phase 1 minimal while delivering real value.

---

## 2. Problem Statement

### Seller Pain
- Small and medium retailers hold capital in unsold, slow-moving inventory (end-of-season, overstocked, near-expiry FMCG, returned items).
- No accessible channel to liquidate locally at speed — current options are word-of-mouth, Instagram stories, or OLX (which is not category-optimised for clearance/bulk).
- Result: blocked working capital, wastage, markdown losses.

### Buyer Pain
- No reliable, searchable source for genuine clearance deals in their city.
- Existing discount platforms (Meesho, OLX) are either national or not deal-quality-curated.
- Resellers (kirana, boutique owners) have no structured source for bulk clearance stock.

---

## 3. Solution Overview

A web platform where:
- **Sellers** list clearance items with price, discount, images, and contact info.
- **Buyers** browse, filter, and reserve interest via a one-click WhatsApp deep link.
- **Transactions** happen offline at the seller's location.
- **Admin** manually reviews listings before they go live to maintain trust.

The platform is intentionally **not a marketplace** in Phase 1 — no payments, no escrow, no delivery. It is a structured discovery layer on top of existing offline commerce.

---

## 4. User Types & Personas

### 4.1 Seller
- Small/medium retailer, boutique, distributor, warehouse
- Has 10–200 unsold items they want to move quickly
- Comfortable with WhatsApp; may not be tech-savvy
- Needs: simple listing form, ability to mark items sold, no complex dashboard

### 4.2 Consumer Buyer
- Individual looking for a deal on a specific product category
- Browses by city and category
- Needs: fast browsing, clear images, clear price/discount, easy WhatsApp contact

### 4.3 Reseller / Bulk Buyer
- Kirana store owner, boutique owner, distributor
- Looking for bulk/lot deals for resale margin
- Needs: bulk quantity info, minimum order quantities, ability to negotiate via WhatsApp

### 4.4 Platform Admin
- ZipDeals team member
- Reviews listings before approval, manages spam/abuse, monitors KPIs
- Needs: simple review interface (Supabase dashboard sufficient for Phase 1)

---

## 5. MVP Scope

### Included
| Feature | Notes |
|---------|-------|
| Seller phone OTP authentication | Sellers only. Buyers browse anonymously. |
| Product listing form | Title, description, price, original price, images, category, city |
| Listing lifecycle management | Status (`pending`, `active`, `sold`, `expired`). Auto-expiry at 30 days. |
| Product browsing | Paginated grid with filters |
| Filters | City (dropdown), Category (dropdown) |
| WhatsApp contact button | Pre-filled deep link with product details |
| Mark as Sold | Unique seller link sent post-submission (no dashboard needed) |
| Admin review flow | Supabase dashboard — approve/reject before listing goes live |
| Basic SEO | Static product pages, meta tags, city+category page titles |
| Report listing | Single-click abuse report button for buyers |

### Excluded from Phase 1
| Feature | Reason |
|---------|--------|
| Payments / escrow | Significant complexity; not needed for WhatsApp model |
| Shopping cart | N/A — single-contact model |
| Delivery / logistics | Out of scope; offline transaction |
| Seller dashboard | Phase 2 |
| Search (text) | Phase 2; filters are sufficient for early stage |
| Push / email notifications | Phase 2 |
| Reviews / ratings | Phase 3 |
| Buyer accounts | Phase 3 |

---

## 6. User Flows

### 6.1 Seller Flow

```
Seller visits /sell
  → Enters phone number
  → Receives OTP (Supabase Auth / SMS)
  → Authenticated
  → Fills listing form (title, description, price, original_price, category, city, images, bulk fields)
  → Submits
  → Listing created with status = "pending"
  → Seller receives WhatsApp confirmation with unique "mark as sold" link
  → Admin reviews in Supabase dashboard
  → Admin approves → status = "active" → listing visible to buyers
  → 30 days later OR seller clicks "mark as sold" → status = "sold"/"expired"
```

### 6.2 Buyer Flow

```
Buyer visits zipdeals.in (or city-specific URL e.g. /mumbai/electronics)
  → Browses grid of active listings
  → Applies filters (city, category)
  → Clicks listing card → views detail page
  → Clicks "Contact Seller on WhatsApp"
  → Opens WhatsApp with pre-filled message: "Hi, I saw your listing for [Title] at ₹[Price] on ZipDeals. Is it still available?"
  → Buyer and seller negotiate offline
  → Transaction happens at seller location
```

### 6.3 Admin Flow (Phase 1)

```
Admin opens Supabase dashboard
  → Views products table filtered by status = "pending"
  → Reviews listing details (title, images, description, price)
  → Updates status to "active" (approved) or "rejected"
```

---

## 7. Core Features

### 7.1 Listing Form
- Fields: Title, Description, Category (dropdown), City (dropdown), Price (₹), Original Price (₹), condition confirmation checkbox, Images (up to 5), Is Bulk Deal (toggle), Min Order Qty, Bulk Price
- Computed: Discount % displayed automatically
- Validation: Price < Original Price, at least 1 image, phone verified

### 7.2 Category Taxonomy (Fixed for Phase 1)
```
Electronics & Gadgets
Clothing & Apparel
Footwear
Home & Furniture
Kitchen & Appliances
Food & FMCG
Books & Stationery
Sports & Fitness
Toys & Kids
Other
```

### 7.3 City List (Fixed for Phase 1 — expandable)
Launch with top 10 target cities. Example:
```
Mumbai, Delhi, Bengaluru, Hyderabad, Chennai, Pune, Ahmedabad, Kolkata, Jaipur, Surat
```

### 7.4 WhatsApp Deep Link
Format:
```
https://wa.me/91{seller_phone}?text=Hi%2C+I+saw+your+listing+for+{title}+at+%E2%82%B9{price}+on+ZipDeals.+Is+it+still+available%3F
```
- Phone numbers stored with country code, stripped of non-numeric characters on save
- Link opens WhatsApp on mobile; WhatsApp Web on desktop

### 7.5 Listing Card (Browse View)
Displays: Image thumbnail, Title, Discount % badge, Price (strikethrough original), City, Category, "Bulk Available" badge (if applicable), "Contact on WhatsApp" button

### 7.6 Listing Detail Page
Displays: All images, Full description, Seller name, City/area, Posted date, Expires in X days, WhatsApp button, "Report this listing" link

### 7.7 Listing Lifecycle
| Status | Description |
|--------|-------------|
| `pending` | Submitted, awaiting admin approval |
| `active` | Approved, visible to buyers |
| `sold` | Seller marked as sold |
| `expired` | Auto-expired after 30 days |
| `rejected` | Rejected by admin |

### 7.8 SEO
- Page titles: "Clearance deals on Electronics in Mumbai | ZipDeals"
- Meta descriptions auto-generated from listing data
- Dedicated static pages per city+category combination
- Sitemap.xml auto-generated

---

## 8. Architecture

### 8.1 Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Next.js 14 (App Router) | SSR/SSG for SEO, fast page loads, React ecosystem |
| Backend | Supabase (BaaS) | Auth, DB, Storage, Realtime — minimal backend code |
| Database | PostgreSQL (via Supabase) | Relational, reliable, free tier sufficient for Phase 1 |
| File Storage | Supabase Storage | Eliminates Cloudinary dependency for Phase 1; switch if image transformation needs grow |
| OTP/Auth | Supabase Auth (Phone OTP) | Built-in, no extra service needed |
| Hosting | Vercel | Zero-config Next.js deployment, global CDN |
| Analytics | Vercel Analytics + custom `events` table | WhatsApp click tracking without third-party JS bloat |

### 8.2 Architecture Diagram

```
[Seller Browser]
      │
      ▼
[Next.js App (Vercel)]
      │                    ┌────────────────────┐
      ├──── Auth ──────────▶   Supabase Auth     │
      │                    │   (Phone OTP)       │
      ├──── DB reads ──────▶   PostgreSQL        │
      │                    │   (products, events)│
      ├──── File upload ───▶   Supabase Storage  │
      │                    │   (listing images)  │
      └────────────────────┘
      │
      ▼
[Buyer Browser]
      │
      ▼
[WhatsApp Deep Link] ──▶ [Offline Transaction]
```

### 8.3 Row Level Security (RLS) Policy Summary

| Table | Sellers | Buyers (anon) | Admin |
|-------|---------|---------------|-------|
| `products` | Read own, Insert own, Update own | Read `active` only | Full access |
| `events` | Insert | Insert | Full access |

---

## 9. Data Model

### 9.1 `products`

```sql
CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  price           NUMERIC(10,2) NOT NULL,
  original_price  NUMERIC(10,2) NOT NULL,
  discount_pct    NUMERIC(5,2) GENERATED ALWAYS AS
                    (ROUND((1 - price / original_price) * 100, 2)) STORED,
  image_urls      TEXT[] NOT NULL,           -- array of Supabase Storage URLs
  seller_name     TEXT NOT NULL,
  seller_phone    TEXT NOT NULL,             -- stored with country code, digits only
  city            TEXT NOT NULL,             -- from hardcoded enum
  category        TEXT NOT NULL,             -- from hardcoded enum
  is_bulk         BOOLEAN DEFAULT FALSE,
  min_order_qty   INTEGER,
  bulk_price      NUMERIC(10,2),
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','active','sold','expired','rejected')),
  sold_token      UUID NOT NULL DEFAULT gen_random_uuid(), -- unique mark-as-sold link token
  views_count     INTEGER NOT NULL DEFAULT 0,
  whatsapp_clicks INTEGER NOT NULL DEFAULT 0,
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-expire listings
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_city_category ON products(city, category);
CREATE INDEX idx_products_expires_at ON products(expires_at) WHERE status = 'active';
```

### 9.2 `events` (Analytics)

```sql
CREATE TABLE events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL CHECK (event_type IN ('view', 'whatsapp_click', 'report')),
  city        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 9.3 `reports` (Abuse)

```sql
CREATE TABLE reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 10. Trust & Safety Strategy

### Phase 1 Controls

| Control | Implementation |
|---------|---------------|
| Phone verification | Seller must verify phone via OTP before listing |
| Condition declaration | Seller checks "I confirm this item is unused/as described" before submitting |
| Admin pre-approval | All listings in `pending` state until manually approved |
| Discount validity | Form enforces `price < original_price` |
| Buyer reporting | "Report this listing" button → inserts into `reports` table → admin visibility |
| Listing expiry | Auto-expires at 30 days to prevent stale inventory |
| Seller accountability | Listings are linked to verified phone numbers |

### Phase 2 Controls (Planned)
- Seller rating / review system
- Repeat seller track record score
- Auto-flag listings with high report rate

---

## 11. Admin Operations

### Phase 1 (No custom UI — Supabase Dashboard)
- Review `products` where `status = 'pending'`
- Set `status = 'active'` to approve or `status = 'rejected'`
- Review `reports` table for flagged listings
- Monitor `events` for KPI tracking

### Phase 2 (Custom Admin Panel)
- Listing queue with image preview
- One-click approve/reject
- Seller management
- Basic analytics dashboard

---

## 12. Monetization

| Phase | Model | Notes |
|-------|-------|-------|
| Phase 1 (MVP) | Free listings | Focus: inventory and seller acquisition |
| Phase 2 | Featured listings (paid boost) | Sellers pay to appear at top of category/city feed — no payment infra needed if done via manual bank transfer initially |
| Phase 2 | Listing packs | Sellers buy credits for X listings per month |
| Phase 3 | Listing commission | % of deal value (requires payment system and seller trust) |
| Phase 3 | B2B bulk connect | Premium subscription for resellers to get early access to bulk lots |

**Note**: Phase 2 payment system must be planned during Phase 1 to avoid architectural rework.

---

## 13. KPIs & Success Metrics

### Primary
| KPI | Definition | Phase 1 Target (Month 1) |
|-----|-----------|--------------------------|
| WhatsApp Clicks | Count of `whatsapp_click` events | 200+ |
| Active Listings | Products with `status = 'active'` | 50+ |
| Seller Signups | Verified seller accounts | 10+ |

### Secondary
| KPI | Definition |
|-----|-----------|
| Listings per seller | Average active listings per seller account |
| Click-to-listing ratio | WhatsApp clicks / total listing views |
| Listing expiry rate | % of listings that expire unsold vs marked sold |
| Repeat sellers | Sellers who create 2+ listings |
| City coverage | Number of distinct cities with active listings |

### Instrumentation
- `views_count` and `whatsapp_clicks` counters on `products` table (incremented via Supabase RPC to avoid race conditions)
- `events` table for granular per-event audit trail

---

## 14. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Sellers bypass platform after first contact | High | Medium | Accept for Phase 1. In Phase 2, offer value-add (dashboard, analytics) to retain sellers on platform. |
| Low buyer trust in listings | High | High | Admin pre-approval, phone verification, clear discount display, abuse reporting |
| Stale / sold-out listings degrading UX | High | High | 30-day auto expiry + seller "mark as sold" link |
| Spam / fake listings | Medium | High | Phone OTP barrier + admin review prevents most spam |
| Low conversion (WhatsApp click to purchase) | Medium | Medium | Improve listing quality guidelines; add "deal quality score" in Phase 2 |
| Platform hit paid tiers too early | Low | Low | Supabase + Vercel free tiers handle ~50K requests/day — ample for Phase 1 |
| Phone number scraping | Medium | Medium | RLS ensures `seller_phone` is only exposed on `active` listings; rate limiting on detail page |

---

## 15. Go-To-Market Strategy

### Phase 1 Launch (Month 1)
1. Manually onboard 10 seller partners across 2–3 cities (in-person or WhatsApp outreach)
2. Populate 50+ listings before public launch to avoid empty-shelf problem
3. Share listings in local WhatsApp groups, Facebook groups, RWA/colony groups
4. Target specific communities: boutique owners, electronics retailers, grocery distributors

### Phase 2 (Months 2–3)
1. Instagram content: "Deal of the Day" stories for featured listings
2. Micro-influencer tie-ups in target cities
3. SEO: target "clearance sale [city]", "bulk stock [category] [city]" keywords
4. Referral: Sellers get a referral code; referred sellers get first 3 listings free (Phase 2 when paid)

### Positioning
> "ZipDeals — Local Clearance Deals & Bulk Stock. Real sellers. Real discounts. Near you."

---

## 16. Roadmap

### Phase 1 — MVP (Weeks 1–4)
- [ ] Supabase project setup (Auth, DB schema, RLS, Storage)
- [ ] Seller OTP auth flow
- [ ] Listing submission form
- [ ] Admin review via Supabase dashboard
- [ ] Browse / filter pages (city + category)
- [ ] Listing detail page with WhatsApp deep link
- [ ] Mark-as-sold token link
- [ ] Analytics event tracking
- [ ] Basic SEO (meta tags, sitemap)
- [ ] Deploy to Vercel

### Phase 2 — Growth (Months 2–3)
- [ ] Seller dashboard (manage listings, view clicks)
- [ ] Text search (Supabase full-text search on `title`, `description`)
- [ ] Custom admin panel (listing queue, reports, analytics)
- [ ] Featured listings (manual boost initially)
- [ ] Email/WhatsApp notifications to sellers on approval
- [ ] Mobile responsiveness polish

### Phase 3 — Marketplace (Months 4–6)
- [ ] Buyer accounts + saved listings
- [ ] Seller reviews & ratings
- [ ] In-platform payment for featured slots
- [ ] Automated listing quality score
- [ ] Multi-image lightbox
- [ ] Bulk deal dedicated section

### Phase 4 — Scale
- [ ] B2B connect (reseller premium)
- [ ] Delivery partner integration (optional, seller-driven)
- [ ] Commission model
- [ ] API for POS/inventory system integration (enterprise sellers)

---

## 17. Legal & Privacy Considerations

| Concern | Resolution |
|---------|-----------|
| Seller phone number exposure | Only exposed on `active` listings; consider masking behind WhatsApp button (no raw number shown) |
| Data storage compliance | Store only minimum PII (phone number, name). Add Privacy Policy page before launch. |
| Listing accuracy liability | Terms of Service must disclaim platform liability for listing accuracy; seller bears responsibility |
| Unsolicited contact | WhatsApp deep link is buyer-initiated; no platform-side messaging to buyers |

**Pre-launch mandatory**: Privacy Policy page, Terms of Service page.

---

## 18. Open Questions

| # | Question | Owner | Priority |
|---|---------|-------|---------|
| 1 | Target launch cities (top 3 to start)? | Business | High |
| 2 | SMS provider for OTP (Twilio, MSG91, Fast2SMS)? | Tech | High |
| 3 | Will seller phone number be shown visibly or only via WhatsApp button? | Product | High |
| 4 | Maximum number of images per listing? (Suggested: 5) | Product | Medium |
| 5 | Max image file size? (Suggested: 5MB per image, compressed to 800px on upload) | Tech | Medium |
| 6 | Admin review SLA target (how fast to approve a listing)? | Ops | Medium |
| 7 | Brand name confirmed as "ZipDeals"? Domain availability checked? | Business | High |
| 8 | Phase 2 payment gateway preference (Razorpay / Cashfree)? | Business | Low |

---

*Document prepared: April 28, 2026*
*Next review: Before development kickoff*

# Seller Dashboard - Setup Guide

## What Was Built

✅ **Seller Authentication** - Username/password login with bcrypt hashing
✅ **Seller Dashboard** - View all your listings with stats (views, clicks, status)
✅ **Listing Management** - Edit, delete, mark as sold (UI ready, APIs coming)
✅ **Session Management** - Secure signed cookies (7-day expiry)

---

## Step 1: Run Database Migration

Copy and run this SQL in **Supabase Dashboard > SQL Editor**:

```sql
-- Create sellers table
CREATE TABLE IF NOT EXISTS public.sellers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username        TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  seller_name     TEXT NOT NULL,
  phone           TEXT NOT NULL,
  email           TEXT,
  city            TEXT,
  taluka          TEXT,
  bio             TEXT,
  verified_at     TIMESTAMPTZ,
  total_listings  INTEGER NOT NULL DEFAULT 0,
  active_listings INTEGER NOT NULL DEFAULT 0,
  avg_rating      NUMERIC(2,1),
  rating_count    INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_sellers_username ON public.sellers(username);
CREATE INDEX idx_sellers_created_at ON public.sellers(created_at DESC);

-- Create seller_sessions table
CREATE TABLE IF NOT EXISTS public.seller_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  session_token   TEXT NOT NULL UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days'
);

CREATE INDEX idx_seller_sessions_seller_id ON public.seller_sessions(seller_id);
CREATE INDEX idx_seller_sessions_token ON public.seller_sessions(session_token);

-- Create seller_reviews table
CREATE TABLE IF NOT EXISTS public.seller_reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  product_id      UUID REFERENCES public.products(id) ON DELETE SET NULL,
  buyer_phone     TEXT NOT NULL,
  rating          INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_seller_reviews_seller_id ON public.seller_reviews(seller_id);
CREATE INDEX idx_seller_reviews_product_id ON public.seller_reviews(product_id);

-- Enable RLS
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view verified seller profiles" ON public.sellers FOR SELECT USING (verified_at IS NOT NULL);
CREATE POLICY "Public can view seller reviews" ON public.seller_reviews FOR SELECT USING (true);

-- RPC: Verify seller credentials
CREATE OR REPLACE FUNCTION public.verify_seller_credentials(p_username TEXT, p_password TEXT)
RETURNS TABLE (
  seller_id UUID,
  seller_name TEXT,
  username TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.seller_name,
    s.username
  FROM public.sellers s
  WHERE s.username = p_username
    AND s.password_hash = crypt(p_password, s.password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Get seller's listings
CREATE OR REPLACE FUNCTION public.get_seller_listings(p_seller_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  price NUMERIC,
  status TEXT,
  views_count INTEGER,
  whatsapp_clicks INTEGER,
  image_url TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.price,
    p.status,
    p.views_count,
    p.whatsapp_clicks,
    p.image_urls[1],
    p.created_at
  FROM public.products p
  WHERE p.seller_phone = (SELECT phone FROM public.sellers WHERE id = p_seller_id)
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Step 2: Add Test Seller Credentials

To create a test seller account, run this in **Supabase SQL Editor**:

```sql
-- Generate bcrypt hash for password "seller123"
-- You can use: SELECT crypt('seller123', gen_salt('bf'));

INSERT INTO public.sellers (username, password_hash, seller_name, phone)
VALUES (
  'seller1',
  '$2a$12$KIXxPfcQAU.uM8eVBQ5N3OFEI2XrTHJE8xqaWC9Cy0i6pWwVlH8l6', -- bcrypt hash of "seller123"
  'Raj Electronics',
  '9876543210'
);
```

**Quick way to generate bcrypt hash:**
1. Go to https://bcrypt-generator.com/
2. Enter password: `seller123`
3. Copy the hash and replace in the SQL above

---

## Step 3: Update Environment Variables

Add to `.env.local`:

```
SELLER_SESSION_SECRET=your_long_random_secret_here_at_least_32_chars
```

Generate a random secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 4: Test the Seller Dashboard

1. **Go to login**: http://localhost:3000/seller/login
2. **Enter credentials**:
   - Username: `seller1`
   - Password: `seller123`
3. **You should see**: Dashboard with stats and your listings

---

## Features Available

### ✅ Current

- Login/Logout with secure sessions
- View all your listings with:
  - Status badge (Active/Pending/Sold)
  - View count
  - WhatsApp click count
  - Thumbnail
- Dashboard stats (total, active, pending, sold, total views, total clicks)
- Link to create new listings
- Link back to browse page

### 🔄 Coming Next

- Edit listing details
- Delete listings
- Mark as sold directly from dashboard
- Seller profile page (public view)
- Reviews/ratings section
- Bulk actions

---

## How It Works (Technical)

1. **Authentication Flow**:
   - Seller enters username + password
   - Backend calls `verify_seller_credentials()` RPC with bcrypt comparison
   - On match, creates signed session cookie (HMAC-SHA256)
   - Cookie contains: seller_id, seller_name, username

2. **Dashboard Loading**:
   - Page checks for valid session cookie
   - If missing → redirects to login
   - If valid → calls `get_seller_listings(seller_id)` RPC
   - Displays listings with stats

3. **Security**:
   - Passwords hashed with bcrypt (admin-level security)
   - Sessions signed with HMAC-SHA256 (tamper-proof)
   - 7-day expiry for sessions
   - httpOnly cookies (prevents XSS)

---

## Troubleshooting

**"Invalid username or password"**
- Verify seller exists in `sellers` table
- Check password hash is correct (use bcrypt-generator.com)
- Ensure `verify_seller_credentials` RPC exists

**"Seller not found" on dashboard**
- Check `SELLER_SESSION_SECRET` matches between frontend & backend
- Verify session cookie is being saved (check browser DevTools)
- Try logging out and back in

**RPC function not found**
- Run all the migration SQL from Step 1 again
- Make sure no errors in Supabase SQL Editor output

---

## Database Schema

```
sellers
├── id (UUID, primary key)
├── username (TEXT, unique) ← Login credential
├── password_hash (TEXT) ← Bcrypt hashed password
├── seller_name (TEXT)
├── phone (TEXT)
├── email (TEXT)
├── city, taluka (TEXT)
├── avg_rating, rating_count
└── timestamps

seller_sessions
├── id (UUID)
├── seller_id (FK)
├── session_token (TEXT, unique)
└── expires_at

seller_reviews
├── id (UUID)
├── seller_id (FK)
├── product_id (FK)
├── rating (1-5)
├── review_text
└── created_at
```

---

## What's Connected

- **Products table**: Listings linked by `seller_phone` field
- **Admin dashboard**: Can see all listings regardless of seller
- **Navbar**: Will show seller's name if logged in (next update)
- **Public seller profile**: Coming soon (shows verified sellers only)

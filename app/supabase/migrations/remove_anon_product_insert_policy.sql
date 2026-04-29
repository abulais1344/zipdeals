-- Migration: remove the permissive anonymous INSERT policy on products.
--
-- Previously, the anon Supabase client could insert rows directly into the
-- products table from the browser (the only check was status = 'pending'),
-- allowing any user to spoof seller_name, seller_phone, and seller_profile_id.
--
-- All listing creation now goes through the protected server-side route
-- POST /api/seller/listings  (app/src/app/api/seller/listings/route.ts),
-- which reads seller identity from the verified cookie session and uses the
-- service-role client for the insert (bypassing RLS by design).
-- Anon clients therefore no longer need — and must not have — INSERT access.

DROP POLICY IF EXISTS "Anyone can submit pending listings" ON public.products;

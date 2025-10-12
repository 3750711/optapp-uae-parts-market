-- ================================================================
-- GRANT permissions for products_public and products_for_buyers views
-- Critical: Without these grants, even authenticated users can't read views
-- ================================================================

-- Step 1: Grant read access to products_public (public catalog view)
-- This view excludes sensitive fields and is safe for anonymous access
GRANT SELECT ON public.products_public TO anon;
GRANT SELECT ON public.products_public TO authenticated;

-- Step 2: Grant read access to products_for_buyers (full product view)
-- This view includes all fields and should only be accessible to authenticated users
GRANT SELECT ON public.products_for_buyers TO authenticated;

-- Step 3: Explicitly revoke access from anonymous users to products_for_buyers
REVOKE ALL ON public.products_for_buyers FROM anon;

-- Step 4: Add documentation comments
COMMENT ON VIEW public.products_public IS 
'Public catalog view of active products. Excludes sensitive fields (price, delivery_price, seller_name, telegram_url, phone_url). Accessible to anonymous and authenticated users for public seller profiles.';

COMMENT ON VIEW public.products_for_buyers IS 
'Full product view including all fields (price, delivery_price, seller contact info). Accessible only to authenticated buyers. Used in authenticated catalog browsing.';

-- Step 5: Log the grant operation
DO $$
BEGIN
  RAISE NOTICE 'Successfully granted SELECT permissions:';
  RAISE NOTICE '  - products_public: anon, authenticated';
  RAISE NOTICE '  - products_for_buyers: authenticated only';
END $$;
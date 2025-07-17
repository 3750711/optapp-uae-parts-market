-- Enhanced Telegram username normalization - fix all remaining records
-- This migration will update ALL records that don't have @ prefix, regardless of validation

DO $$
DECLARE
  profiles_updated INTEGER;
  products_updated INTEGER;
  orders_order_updated INTEGER;
  orders_buyer_updated INTEGER;
  stores_updated INTEGER;
BEGIN
  RAISE NOTICE 'Starting enhanced Telegram username normalization...';
  
  -- Update profiles table - handle all cases including edge cases
  UPDATE public.profiles 
  SET telegram = '@' || TRIM(telegram)
  WHERE telegram IS NOT NULL 
    AND TRIM(telegram) != '' 
    AND TRIM(telegram) !~ '^@'  -- Doesn't start with @
    AND LENGTH(TRIM(telegram)) >= 3;  -- Minimum reasonable length
  
  GET DIAGNOSTICS profiles_updated = ROW_COUNT;
  RAISE NOTICE 'Updated % profiles.telegram records', profiles_updated;
  
  -- Update products table - handle all telegram_url cases
  UPDATE public.products 
  SET telegram_url = '@' || TRIM(telegram_url)
  WHERE telegram_url IS NOT NULL 
    AND TRIM(telegram_url) != '' 
    AND TRIM(telegram_url) !~ '^@'  -- Doesn't start with @
    AND LENGTH(TRIM(telegram_url)) >= 3;  -- Minimum reasonable length
  
  GET DIAGNOSTICS products_updated = ROW_COUNT;
  RAISE NOTICE 'Updated % products.telegram_url records', products_updated;
  
  -- Update orders table - telegram_url_order field
  UPDATE public.orders 
  SET telegram_url_order = '@' || TRIM(telegram_url_order)
  WHERE telegram_url_order IS NOT NULL 
    AND TRIM(telegram_url_order) != '' 
    AND TRIM(telegram_url_order) !~ '^@'  -- Doesn't start with @
    AND LENGTH(TRIM(telegram_url_order)) >= 3;
  
  GET DIAGNOSTICS orders_order_updated = ROW_COUNT;
  RAISE NOTICE 'Updated % orders.telegram_url_order records', orders_order_updated;
  
  -- Update orders table - telegram_url_buyer field
  UPDATE public.orders 
  SET telegram_url_buyer = '@' || TRIM(telegram_url_buyer)
  WHERE telegram_url_buyer IS NOT NULL 
    AND TRIM(telegram_url_buyer) != '' 
    AND TRIM(telegram_url_buyer) !~ '^@'  -- Doesn't start with @
    AND LENGTH(TRIM(telegram_url_buyer)) >= 3;
  
  GET DIAGNOSTICS orders_buyer_updated = ROW_COUNT;
  RAISE NOTICE 'Updated % orders.telegram_url_buyer records', orders_buyer_updated;
  
  -- Update stores table - telegram field
  UPDATE public.stores 
  SET telegram = '@' || TRIM(telegram)
  WHERE telegram IS NOT NULL 
    AND TRIM(telegram) != '' 
    AND TRIM(telegram) !~ '^@'  -- Doesn't start with @
    AND LENGTH(TRIM(telegram)) >= 3;
  
  GET DIAGNOSTICS stores_updated = ROW_COUNT;
  RAISE NOTICE 'Updated % stores.telegram records', stores_updated;
  
  -- Final verification - count remaining records without @
  RAISE NOTICE 'Verification - Profiles without @: %', (
    SELECT COUNT(*) FROM public.profiles 
    WHERE telegram IS NOT NULL 
    AND TRIM(telegram) != '' 
    AND TRIM(telegram) !~ '^@'
  );
  
  RAISE NOTICE 'Verification - Products without @: %', (
    SELECT COUNT(*) FROM public.products 
    WHERE telegram_url IS NOT NULL 
    AND TRIM(telegram_url) != '' 
    AND TRIM(telegram_url) !~ '^@'
  );
  
  RAISE NOTICE 'Enhanced Telegram username normalization completed successfully!';
  RAISE NOTICE 'Total updated: profiles=%, products=%, orders_order=%, orders_buyer=%, stores=%', 
    profiles_updated, products_updated, orders_order_updated, orders_buyer_updated, stores_updated;
END $$;
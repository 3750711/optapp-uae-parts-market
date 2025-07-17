-- Enhanced Telegram username normalization - fix all remaining records
-- This migration will update ALL records that don't have @ prefix, regardless of validation

DO $$
BEGIN
  RAISE NOTICE 'Starting enhanced Telegram username normalization...';
  
  -- Update profiles table - handle all cases including edge cases
  UPDATE public.profiles 
  SET telegram = '@' || TRIM(telegram)
  WHERE telegram IS NOT NULL 
    AND TRIM(telegram) != '' 
    AND TRIM(telegram) !~ '^@'  -- Doesn't start with @
    AND LENGTH(TRIM(telegram)) >= 3;  -- Minimum reasonable length
  
  RAISE NOTICE 'Updated % profiles.telegram records', (SELECT ROW_COUNT());
  
  -- Update products table - handle all telegram_url cases
  UPDATE public.products 
  SET telegram_url = '@' || TRIM(telegram_url)
  WHERE telegram_url IS NOT NULL 
    AND TRIM(telegram_url) != '' 
    AND TRIM(telegram_url) !~ '^@'  -- Doesn't start with @
    AND LENGTH(TRIM(telegram_url)) >= 3;  -- Minimum reasonable length
  
  RAISE NOTICE 'Updated % products.telegram_url records', (SELECT ROW_COUNT());
  
  -- Update orders table - telegram_url_order field
  UPDATE public.orders 
  SET telegram_url_order = '@' || TRIM(telegram_url_order)
  WHERE telegram_url_order IS NOT NULL 
    AND TRIM(telegram_url_order) != '' 
    AND TRIM(telegram_url_order) !~ '^@'  -- Doesn't start with @
    AND LENGTH(TRIM(telegram_url_order)) >= 3;
  
  RAISE NOTICE 'Updated % orders.telegram_url_order records', (SELECT ROW_COUNT());
  
  -- Update orders table - telegram_url_buyer field
  UPDATE public.orders 
  SET telegram_url_buyer = '@' || TRIM(telegram_url_buyer)
  WHERE telegram_url_buyer IS NOT NULL 
    AND TRIM(telegram_url_buyer) != '' 
    AND TRIM(telegram_url_buyer) !~ '^@'  -- Doesn't start with @
    AND LENGTH(TRIM(telegram_url_buyer)) >= 3;
  
  RAISE NOTICE 'Updated % orders.telegram_url_buyer records', (SELECT ROW_COUNT());
  
  -- Update stores table - telegram field
  UPDATE public.stores 
  SET telegram = '@' || TRIM(telegram)
  WHERE telegram IS NOT NULL 
    AND TRIM(telegram) != '' 
    AND TRIM(telegram) !~ '^@'  -- Doesn't start with @
    AND LENGTH(TRIM(telegram)) >= 3;
  
  RAISE NOTICE 'Updated % stores.telegram records', (SELECT ROW_COUNT());
  
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
END $$;
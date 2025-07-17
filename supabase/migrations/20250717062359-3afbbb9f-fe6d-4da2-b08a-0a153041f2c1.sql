-- Fix existing Telegram usernames to ensure they all have @ prefix
-- Only update usernames that look like valid Telegram usernames but are missing @

-- First, let's see what we're working with
DO $$
BEGIN
  RAISE NOTICE 'Starting Telegram username normalization...';
  
  -- Update profiles table where telegram field doesn't start with @ but looks like a username
  UPDATE public.profiles 
  SET telegram = '@' || telegram
  WHERE telegram IS NOT NULL 
    AND telegram != '' 
    AND telegram !~ '^@'  -- Doesn't start with @
    AND telegram ~ '^[a-zA-Z][a-zA-Z0-9_]{4,31}$'  -- Looks like valid telegram username
    AND NOT telegram ~ '__'  -- No consecutive underscores
    AND telegram !~ '_$';  -- Doesn't end with underscore
  
  RAISE NOTICE 'Updated profiles.telegram field';
  
  -- Update requests table where telegram field doesn't start with @ but looks like a username
  UPDATE public.requests 
  SET telegram = '@' || telegram
  WHERE telegram IS NOT NULL 
    AND telegram != '' 
    AND telegram !~ '^@'  -- Doesn't start with @
    AND telegram ~ '^[a-zA-Z][a-zA-Z0-9_]{4,31}$'  -- Looks like valid telegram username
    AND NOT telegram ~ '__'  -- No consecutive underscores
    AND telegram !~ '_$';  -- Doesn't end with underscore
  
  RAISE NOTICE 'Updated requests.telegram field';
  
  -- Update products table where telegram_url field doesn't start with @ but looks like a username
  UPDATE public.products 
  SET telegram_url = '@' || telegram_url
  WHERE telegram_url IS NOT NULL 
    AND telegram_url != '' 
    AND telegram_url !~ '^@'  -- Doesn't start with @
    AND telegram_url ~ '^[a-zA-Z][a-zA-Z0-9_]{4,31}$'  -- Looks like valid telegram username
    AND NOT telegram_url ~ '__'  -- No consecutive underscores
    AND telegram_url !~ '_$';  -- Doesn't end with underscore
  
  RAISE NOTICE 'Updated products.telegram_url field';
  
  -- Update orders table where telegram_url_order field doesn't start with @ but looks like a username
  UPDATE public.orders 
  SET telegram_url_order = '@' || telegram_url_order
  WHERE telegram_url_order IS NOT NULL 
    AND telegram_url_order != '' 
    AND telegram_url_order !~ '^@'  -- Doesn't start with @
    AND telegram_url_order ~ '^[a-zA-Z][a-zA-Z0-9_]{4,31}$'  -- Looks like valid telegram username
    AND NOT telegram_url_order ~ '__'  -- No consecutive underscores
    AND telegram_url_order !~ '_$';  -- Doesn't end with underscore
  
  RAISE NOTICE 'Updated orders.telegram_url_order field';
  
  -- Update orders table where telegram_url_buyer field doesn't start with @ but looks like a username
  UPDATE public.orders 
  SET telegram_url_buyer = '@' || telegram_url_buyer
  WHERE telegram_url_buyer IS NOT NULL 
    AND telegram_url_buyer != '' 
    AND telegram_url_buyer !~ '^@'  -- Doesn't start with @
    AND telegram_url_buyer ~ '^[a-zA-Z][a-zA-Z0-9_]{4,31}$'  -- Looks like valid telegram username
    AND NOT telegram_url_buyer ~ '__'  -- No consecutive underscores
    AND telegram_url_buyer !~ '_$';  -- Doesn't end with underscore
  
  RAISE NOTICE 'Updated orders.telegram_url_buyer field';
  
  -- Update stores table where telegram field doesn't start with @ but looks like a username
  UPDATE public.stores 
  SET telegram = '@' || telegram
  WHERE telegram IS NOT NULL 
    AND telegram != '' 
    AND telegram !~ '^@'  -- Doesn't start with @
    AND telegram ~ '^[a-zA-Z][a-zA-Z0-9_]{4,31}$'  -- Looks like valid telegram username
    AND NOT telegram ~ '__'  -- No consecutive underscores
    AND telegram !~ '_$';  -- Doesn't end with underscore
  
  RAISE NOTICE 'Updated stores.telegram field';
  
  RAISE NOTICE 'Telegram username normalization completed successfully!';
END $$;
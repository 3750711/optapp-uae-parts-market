-- Create optimized search indexes for products table
-- These indexes will significantly improve search performance

-- Index for seller_name (frequently searched field)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_seller_name_gin 
ON public.products USING gin(seller_name gin_trgm_ops);

-- Index for brand (frequently searched field)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_brand_gin 
ON public.products USING gin(brand gin_trgm_ops);

-- Index for model (frequently searched field)  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_model_gin 
ON public.products USING gin(model gin_trgm_ops);

-- Index for description (text search)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_description_gin 
ON public.products USING gin(description gin_trgm_ops);

-- Composite index for status + created_at (common filtering combination)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_status_created_at 
ON public.products(status, created_at DESC);

-- Composite index for status + price (for price-based filtering)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_status_price 
ON public.products(status, price);

-- Index for lot_number (exact numeric searches)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_lot_number 
ON public.products(lot_number);

-- Ensure pg_trgm extension is enabled for trigram indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm;
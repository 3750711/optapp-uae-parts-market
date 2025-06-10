
-- Migration to fill missing cloudinary_public_id values from existing URLs
-- This will help improve image display performance

DO $$
DECLARE
    product_record RECORD;
    extracted_id TEXT;
    update_count INTEGER := 0;
BEGIN
    -- Update products where cloudinary_public_id is null but we have cloudinary URLs
    FOR product_record IN 
        SELECT id, cloudinary_url
        FROM products 
        WHERE cloudinary_public_id IS NULL 
        AND cloudinary_url IS NOT NULL 
        AND cloudinary_url LIKE '%cloudinary.com%'
    LOOP
        -- Extract public_id from URL (simplified version for SQL)
        -- This handles basic cases - complex transformations may need manual review
        extracted_id := NULL;
        
        -- Handle standard Cloudinary URLs with version
        IF product_record.cloudinary_url ~ 'cloudinary\.com/[^/]+/image/upload/v\d+/(.+)\.(jpg|jpeg|png|webp)' THEN
            extracted_id := (regexp_matches(product_record.cloudinary_url, 'cloudinary\.com/[^/]+/image/upload/v\d+/(.+)\.(jpg|jpeg|png|webp)'))[1];
        -- Handle URLs without version
        ELSIF product_record.cloudinary_url ~ 'cloudinary\.com/[^/]+/image/upload/(.+)\.(jpg|jpeg|png|webp)' THEN
            extracted_id := (regexp_matches(product_record.cloudinary_url, 'cloudinary\.com/[^/]+/image/upload/(.+)\.(jpg|jpeg|png|webp)'))[1];
        END IF;
        
        -- Clean up transformation parameters if they exist
        IF extracted_id IS NOT NULL THEN
            -- Remove common transformation patterns (w_, h_, c_, q_, f_, etc.)
            extracted_id := regexp_replace(extracted_id, '^[^/]*/', '');
            
            -- Update the product if we successfully extracted an ID
            IF length(extracted_id) > 0 AND extracted_id NOT LIKE '%,%' THEN
                UPDATE products 
                SET cloudinary_public_id = extracted_id
                WHERE id = product_record.id;
                
                update_count := update_count + 1;
                
                RAISE LOG 'Updated product % with public_id: %', product_record.id, extracted_id;
            END IF;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Migration completed. Updated % products with cloudinary_public_id', update_count;
END $$;

-- Optional: Update product_images table as well if needed
DO $$
DECLARE
    image_record RECORD;
    extracted_id TEXT;
    update_count INTEGER := 0;
BEGIN
    -- Add cloudinary_public_id column to product_images if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_images' 
        AND column_name = 'cloudinary_public_id'
    ) THEN
        ALTER TABLE product_images ADD COLUMN cloudinary_public_id TEXT;
    END IF;
    
    -- Update product_images where cloudinary_public_id is null but we have cloudinary URLs
    FOR image_record IN 
        SELECT id, url
        FROM product_images 
        WHERE (cloudinary_public_id IS NULL OR cloudinary_public_id = '')
        AND url IS NOT NULL 
        AND url LIKE '%cloudinary.com%'
    LOOP
        extracted_id := NULL;
        
        -- Handle standard Cloudinary URLs with version
        IF image_record.url ~ 'cloudinary\.com/[^/]+/image/upload/v\d+/(.+)\.(jpg|jpeg|png|webp)' THEN
            extracted_id := (regexp_matches(image_record.url, 'cloudinary\.com/[^/]+/image/upload/v\d+/(.+)\.(jpg|jpeg|png|webp)'))[1];
        -- Handle URLs without version
        ELSIF image_record.url ~ 'cloudinary\.com/[^/]+/image/upload/(.+)\.(jpg|jpeg|png|webp)' THEN
            extracted_id := (regexp_matches(image_record.url, 'cloudinary\.com/[^/]+/image/upload/(.+)\.(jpg|jpeg|png|webp)'))[1];
        END IF;
        
        -- Clean up transformation parameters
        IF extracted_id IS NOT NULL THEN
            extracted_id := regexp_replace(extracted_id, '^[^/]*/', '');
            
            IF length(extracted_id) > 0 AND extracted_id NOT LIKE '%,%' THEN
                UPDATE product_images 
                SET cloudinary_public_id = extracted_id
                WHERE id = image_record.id;
                
                update_count := update_count + 1;
            END IF;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Updated % product_images with cloudinary_public_id', update_count;
END $$;

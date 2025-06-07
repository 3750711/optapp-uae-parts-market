
import { supabase } from "@/integrations/supabase/client";
import { cleanPublicId, isValidPublicId, getPreviewImageUrl } from "./cloudinaryUtils";

export interface CleanupResult {
  success: boolean;
  processed: number;
  updated: number;
  errors: string[];
}

export const cleanupCloudinaryData = async (): Promise<CleanupResult> => {
  const result: CleanupResult = {
    success: false,
    processed: 0,
    updated: 0,
    errors: []
  };

  try {
    console.log('🧹 Starting Cloudinary data cleanup...');

    // Fetch all products with cloudinary data
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, cloudinary_public_id, cloudinary_url, preview_image_url')
      .not('cloudinary_public_id', 'is', null);

    if (fetchError) {
      result.errors.push(`Failed to fetch products: ${fetchError.message}`);
      return result;
    }

    if (!products || products.length === 0) {
      console.log('✅ No products with Cloudinary data found');
      result.success = true;
      return result;
    }

    console.log(`📊 Found ${products.length} products with Cloudinary data`);

    for (const product of products) {
      result.processed++;

      try {
        if (!product.cloudinary_public_id) {
          console.log(`⏭️ Skipping product ${product.id} - no public_id`);
          continue;
        }

        const originalPublicId = product.cloudinary_public_id;
        const cleanedPublicId = cleanPublicId(originalPublicId);

        // Check if cleaning is needed
        if (originalPublicId === cleanedPublicId) {
          console.log(`✅ Product ${product.id} public_id already clean`);
          
          // Just regenerate preview URL if missing
          if (!product.preview_image_url && isValidPublicId(cleanedPublicId)) {
            const newPreviewUrl = getPreviewImageUrl(cleanedPublicId);
            
            const { error: updateError } = await supabase
              .from('products')
              .update({ preview_image_url: newPreviewUrl })
              .eq('id', product.id);

            if (updateError) {
              result.errors.push(`Failed to update preview for ${product.id}: ${updateError.message}`);
            } else {
              result.updated++;
              console.log(`🔄 Generated missing preview for product ${product.id}`);
            }
          }
          continue;
        }

        // Validate cleaned public_id
        if (!isValidPublicId(cleanedPublicId)) {
          result.errors.push(`Invalid public_id format for product ${product.id}: ${cleanedPublicId}`);
          console.error(`❌ Invalid cleaned public_id for product ${product.id}:`, {
            original: originalPublicId,
            cleaned: cleanedPublicId
          });
          continue;
        }

        // Generate new preview URL
        const newPreviewUrl = getPreviewImageUrl(cleanedPublicId);

        // Update the product
        const { error: updateError } = await supabase
          .from('products')
          .update({
            cloudinary_public_id: cleanedPublicId,
            preview_image_url: newPreviewUrl
          })
          .eq('id', product.id);

        if (updateError) {
          result.errors.push(`Failed to update product ${product.id}: ${updateError.message}`);
          console.error(`❌ Failed to update product ${product.id}:`, updateError);
        } else {
          result.updated++;
          console.log(`✅ Updated product ${product.id}:`, {
            originalPublicId,
            cleanedPublicId,
            newPreviewUrl
          });
        }

      } catch (productError) {
        result.errors.push(`Error processing product ${product.id}: ${productError}`);
        console.error(`💥 Error processing product ${product.id}:`, productError);
      }
    }

    result.success = result.errors.length === 0;
    
    console.log('🎉 Cloudinary data cleanup completed:', {
      processed: result.processed,
      updated: result.updated,
      errors: result.errors.length,
      success: result.success
    });

    return result;

  } catch (error) {
    result.errors.push(`Cleanup failed: ${error}`);
    console.error('💥 Cloudinary data cleanup failed:', error);
    return result;
  }
};

// Helper function to cleanup specific product
export const cleanupSingleProduct = async (productId: string): Promise<boolean> => {
  try {
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('id, cloudinary_public_id, cloudinary_url, preview_image_url')
      .eq('id', productId)
      .single();

    if (fetchError || !product) {
      console.error('Failed to fetch product:', fetchError);
      return false;
    }

    if (!product.cloudinary_public_id) {
      console.log('Product has no cloudinary_public_id');
      return true;
    }

    const originalPublicId = product.cloudinary_public_id;
    const cleanedPublicId = cleanPublicId(originalPublicId);

    if (!isValidPublicId(cleanedPublicId)) {
      console.error('Invalid cleaned public_id:', cleanedPublicId);
      return false;
    }

    const newPreviewUrl = getPreviewImageUrl(cleanedPublicId);

    const { error: updateError } = await supabase
      .from('products')
      .update({
        cloudinary_public_id: cleanedPublicId,
        preview_image_url: newPreviewUrl
      })
      .eq('id', productId);

    if (updateError) {
      console.error('Failed to update product:', updateError);
      return false;
    }

    console.log('✅ Product cleanup successful:', {
      productId,
      originalPublicId,
      cleanedPublicId,
      newPreviewUrl
    });

    return true;
  } catch (error) {
    console.error('Error cleaning up product:', error);
    return false;
  }
};

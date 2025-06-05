
import { supabase } from "@/integrations/supabase/client";

interface PreviewResult {
  success: boolean;
  previewUrl?: string;
  previewSize?: number;
  originalSize?: number;
  compressionRatio?: number;
  productUpdated?: boolean;
  error?: string;
}

export const generateProductPreview = async (imageUrl: string, productId: string): Promise<PreviewResult> => {
  try {
    console.log('🎯 generateProductPreview called with:', {
      imageUrl,
      productId,
      timestamp: new Date().toISOString(),
      caller: 'generateProductPreview'
    });

    // CRITICAL: Validate input parameters
    if (!imageUrl || !productId) {
      const errorMsg = `Invalid parameters: imageUrl=${!!imageUrl}, productId=${!!productId}`;
      console.error('❌ Validation failed:', errorMsg);
      return {
        success: false,
        error: errorMsg
      };
    }

    if (!imageUrl.startsWith('http')) {
      const errorMsg = `Invalid imageUrl format: ${imageUrl}`;
      console.error('❌ URL validation failed:', errorMsg);
      return {
        success: false,
        error: errorMsg
      };
    }
    
    console.log('📞 INVOKING Supabase Edge Function: generate-product-preview');
    console.log('📋 Request payload:', {
      imageUrl,
      productId,
      functionName: 'generate-product-preview'
    });
    
    // CRITICAL: Make the actual function call
    const { data, error } = await supabase.functions.invoke('generate-product-preview', {
      body: { 
        imageUrl,
        productId 
      }
    });

    console.log('📥 Edge Function response received:', {
      data,
      error,
      hasData: !!data,
      hasError: !!error,
      timestamp: new Date().toISOString()
    });

    if (error) {
      console.error('❌ Edge Function error:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return {
        success: false,
        error: error.message || 'Failed to generate preview'
      };
    }

    if (data?.success) {
      console.log('✅ Preview generation SUCCESS:', {
        previewUrl: data.previewUrl,
        previewSize: data.previewSize,
        originalSize: data.originalSize,
        compressionRatio: data.compressionRatio,
        productUpdated: data.productUpdated,
        productId,
        imageUrl
      });
      
      return {
        success: true,
        previewUrl: data.previewUrl,
        previewSize: data.previewSize,
        originalSize: data.originalSize,
        compressionRatio: data.compressionRatio,
        productUpdated: data.productUpdated
      };
    } else {
      console.error('❌ Preview generation failed:', {
        error: data?.error,
        data,
        productId,
        imageUrl
      });
      return {
        success: false,
        error: data?.error || 'Unknown error occurred'
      };
    }
  } catch (error) {
    console.error('💥 EXCEPTION in generateProductPreview:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      productId,
      imageUrl,
      timestamp: new Date().toISOString()
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Функция больше не нужна, так как Edge функция сама обновляет базу данных
export const updateProductPreview = async (productId: string, previewUrl: string): Promise<boolean> => {
  try {
    console.log('📝 Updating product preview URL (backup method):', {
      productId,
      previewUrl,
      timestamp: new Date().toISOString()
    });

    const { error } = await supabase
      .from('products')
      .update({ preview_image_url: previewUrl })
      .eq('id', productId);

    if (error) {
      console.error('❌ Error updating product preview URL:', error);
      return false;
    }

    console.log('✅ Product preview URL updated successfully (backup method)');
    return true;
  } catch (error) {
    console.error('💥 Exception in updateProductPreview:', error);
    return false;
  }
};

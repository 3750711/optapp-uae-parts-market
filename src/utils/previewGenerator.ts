
import { supabase } from "@/integrations/supabase/client";

interface PreviewResult {
  success: boolean;
  previewUrl?: string;
  previewSize?: number;
  originalSize?: number;
  compressionRatio?: number;
  error?: string;
}

export const generateProductPreview = async (imageUrl: string, productId: string): Promise<PreviewResult> => {
  try {
    console.log('🎯 generateProductPreview called with:', {
      imageUrl,
      productId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent.substring(0, 50) + '...'
    });
    
    console.log('📞 Invoking Supabase Edge Function: generate-product-preview');
    
    const { data, error } = await supabase.functions.invoke('generate-product-preview', {
      body: { 
        imageUrl,
        productId 
      }
    });

    console.log('📥 Edge Function response:', {
      data,
      error,
      timestamp: new Date().toISOString()
    });

    if (error) {
      console.error('❌ Error calling preview function:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate preview'
      };
    }

    if (data?.success) {
      console.log('✅ Preview generation successful:', {
        previewUrl: data.previewUrl,
        previewSize: data.previewSize,
        originalSize: data.originalSize,
        compressionRatio: data.compressionRatio
      });
      
      return {
        success: true,
        previewUrl: data.previewUrl,
        previewSize: data.previewSize,
        originalSize: data.originalSize,
        compressionRatio: data.compressionRatio
      };
    } else {
      console.error('❌ Preview generation failed:', data?.error);
      return {
        success: false,
        error: data?.error || 'Unknown error occurred'
      };
    }
  } catch (error) {
    console.error('💥 Exception in generateProductPreview:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const updateProductPreview = async (productId: string, previewUrl: string): Promise<boolean> => {
  try {
    console.log('📝 Updating product preview URL:', {
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

    console.log('✅ Product preview URL updated successfully');
    return true;
  } catch (error) {
    console.error('💥 Exception in updateProductPreview:', error);
    return false;
  }
};


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
    console.log('Calling preview generation for:', imageUrl);
    
    const { data, error } = await supabase.functions.invoke('generate-product-preview', {
      body: { 
        imageUrl,
        productId 
      }
    });

    if (error) {
      console.error('Error calling preview function:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate preview'
      };
    }

    if (data?.success) {
      return {
        success: true,
        previewUrl: data.previewUrl,
        previewSize: data.previewSize,
        originalSize: data.originalSize,
        compressionRatio: data.compressionRatio
      };
    } else {
      return {
        success: false,
        error: data?.error || 'Unknown error occurred'
      };
    }
  } catch (error) {
    console.error('Error in generateProductPreview:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const updateProductPreview = async (productId: string, previewUrl: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('products')
      .update({ preview_image_url: previewUrl })
      .eq('id', productId);

    if (error) {
      console.error('Error updating product preview URL:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateProductPreview:', error);
    return false;
  }
};

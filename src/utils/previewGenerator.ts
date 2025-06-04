
import { supabase } from "@/integrations/supabase/client";

interface PreviewGenerationResult {
  success: boolean;
  previewUrl?: string;
  error?: string;
  previewSize?: number;
}

export const generateProductPreview = async (
  imageUrl: string,
  productId?: string
): Promise<PreviewGenerationResult> => {
  try {
    console.log('Generating preview for image:', imageUrl, 'productId:', productId);
    
    const { data, error } = await supabase.functions.invoke('generate-product-preview', {
      body: {
        imageUrl,
        productId
      }
    });

    if (error) {
      console.error('Error invoking preview generation function:', error);
      return {
        success: false,
        error: error.message
      };
    }

    if (!data.previewUrl) {
      console.error('No preview URL returned from function');
      return {
        success: false,
        error: 'No preview URL returned'
      };
    }

    console.log('Preview generated successfully:', data.previewUrl, 'Size:', data.previewSize, 'bytes');
    
    return {
      success: true,
      previewUrl: data.previewUrl,
      previewSize: data.previewSize
    };

  } catch (error) {
    console.error('Error generating preview:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const updateProductPreview = async (
  productId: string,
  previewUrl: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('products')
      .update({ preview_image_url: previewUrl })
      .eq('id', productId);

    if (error) {
      console.error('Error updating product preview URL:', error);
      return false;
    }

    console.log('Product preview URL updated successfully for product:', productId);
    return true;

  } catch (error) {
    console.error('Error updating product preview:', error);
    return false;
  }
};

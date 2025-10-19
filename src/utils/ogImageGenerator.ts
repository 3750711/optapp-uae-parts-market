import { supabase } from "@/integrations/supabase/client";

export interface OGImageOptions {
  type: 'product' | 'store' | 'request';
  title: string;
  description?: string;
  brand?: string;
  model?: string;
  price?: number;
}

/**
 * Generates an OG image URL using the existing generate-og-image Edge Function
 * @param options - Configuration for the OG image generation
 * @returns Promise<string> - Base64 data URL or fallback placeholder
 */
export const generateOGImageUrl = async (options: OGImageOptions): Promise<string> => {
  const { type, title, description, brand, model, price } = options;
  
  // Construct prompt based on type
  let prompt = '';
  
  if (type === 'product') {
    prompt = `Professional automotive parts product card: "${title}"`;
    if (brand) prompt += ` ${brand}`;
    if (model) prompt += ` ${model}`;
    if (price) prompt += `. Price: AED ${price}`;
    prompt += '. Clean white background, modern design, high quality product photography style, PartsBay.ae branding';
  } else if (type === 'store') {
    prompt = `Professional automotive parts store banner: "${title}". Modern business design, clean layout, automotive theme, professional storefront`;
    if (description) prompt += `. ${description}`;
  } else if (type === 'request') {
    prompt = `Automotive parts request card: "${title}"`;
    if (brand) prompt += ` for ${brand}`;
    if (model) prompt += ` ${model}`;
    prompt += '. Professional inquiry design, modern layout, request/quote theme';
  }
  
  try {
    console.log('Generating OG image with prompt:', prompt);
    
    // Call existing Edge Function
    const { data, error } = await supabase.functions.invoke('generate-og-image', {
      body: { prompt }
    });
    
    if (error) {
      console.error('Error generating OG image:', error);
      throw error;
    }
    
    if (data?.image) {
      console.log('OG image generated successfully');
      return data.image;
    }
    
    throw new Error('No image data returned');
  } catch (error) {
    console.error('Failed to generate OG image:', error);
    // Return fallback placeholder
    return 'https://partsbay.ae/placeholder.svg';
  }
};

/**
 * Generate OG image for a product
 */
export const generateProductOGImage = async (
  title: string,
  brand?: string,
  model?: string,
  price?: number
): Promise<string> => {
  return generateOGImageUrl({
    type: 'product',
    title,
    brand,
    model,
    price
  });
};

/**
 * Generate OG image for a store
 */
export const generateStoreOGImage = async (
  storeName: string,
  description?: string
): Promise<string> => {
  return generateOGImageUrl({
    type: 'store',
    title: storeName,
    description
  });
};

/**
 * Generate OG image for a request
 */
export const generateRequestOGImage = async (
  requestTitle: string,
  brand?: string,
  model?: string
): Promise<string> => {
  return generateOGImageUrl({
    type: 'request',
    title: requestTitle,
    brand,
    model
  });
};

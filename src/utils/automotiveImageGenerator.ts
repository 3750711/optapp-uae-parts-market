import { supabase } from "@/integrations/supabase/client";

export interface AutomotiveImageResult {
  image: string;
  type: string;
  prompt: string;
}

export const generateAutomotiveImage = async (
  type: 'hero' | 'logo' | 'engine' | 'brakes' | 'wheels' | 'interior' | 'abstract' = 'hero',
  customPrompt?: string
): Promise<AutomotiveImageResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-automotive-images', {
      body: { type, customPrompt }
    });

    if (error) {
      throw new Error(error.message || 'Failed to generate automotive image');
    }

    return data;
  } catch (error) {
    console.error('Error generating automotive image:', error);
    throw error;
  }
};

export const automotiveImageTypes = {
  hero: 'Premium automotive parts showcase',
  logo: 'Professional automotive logo',
  engine: 'Luxury car engine components',
  brakes: 'High-end brake system',
  wheels: 'Premium wheels and rims',
  interior: 'Luxury automotive interior',
  abstract: 'Abstract automotive elements'
} as const;
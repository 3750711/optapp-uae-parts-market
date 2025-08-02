
import { supabase } from "@/integrations/supabase/client";

export interface AutomotiveImageResult {
  image: string;
  type: string;
  prompt: string;
}

export const generateAutomotiveImage = async (
  type: 'hero' | 'logo' | 'engine' | 'brakes' | 'wheels' | 'interior' | 'abstract' | 'used_parts' | 'used_engine' | 'used_transmission' | 'used_suspension' | 'used_electrical' = 'hero',
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
  abstract: 'Abstract automotive elements',
  used_parts: 'Professional used car parts',
  used_engine: 'Used engine components',
  used_transmission: 'Used transmission parts',
  used_suspension: 'Used suspension components',
  used_electrical: 'Used electrical parts'
} as const;

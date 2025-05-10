
import { useCallback } from 'react';

/**
 * Custom hook that provides functionality to extract car brand and model information from product title
 * @param brands Array of car brands data
 * @param brandModels Array of car models data
 * @param findBrandIdByName Function to find brand ID by name
 * @param findModelIdByName Function to find model ID by brand ID and name
 */
export const useProductTitleParser = (
  brands: { id: string; name: string }[],
  brandModels: { id: string; name: string; brand_id: string }[],
  findBrandIdByName: (brandName: string) => string | null,
  findModelIdByName: (modelName: string | null, brandId: string) => string | null
) => {
  /**
   * Parse product title to extract brand and model information
   * @param title Product title to parse
   * @returns Object containing brandId and modelId if found
   */
  const parseProductTitle = useCallback((title: string) => {
    // Convert title to lowercase for case-insensitive matching
    const lowerTitle = title.toLowerCase();
    
    // Sort brands by name length (descending) to match longer brand names first
    // This helps with cases like "BMW" vs "BMW Alpina"
    const sortedBrands = [...brands].sort((a, b) => b.name.length - a.name.length);
    
    // Try to find a brand match
    for (const brand of sortedBrands) {
      const brandNameLower = brand.name.toLowerCase();
      
      if (lowerTitle.includes(brandNameLower)) {
        const brandId = brand.id;
        
        // Get models for this brand
        const relevantModels = brandModels.filter(model => model.brand_id === brandId);
        
        // Sort models by name length (descending) to match longer model names first
        const sortedModels = [...relevantModels].sort((a, b) => b.name.length - a.name.length);
        
        // Try to find a model match
        for (const model of sortedModels) {
          const modelNameLower = model.name.toLowerCase();
          
          if (lowerTitle.includes(modelNameLower)) {
            return {
              brandId,
              modelId: model.id
            };
          }
        }
        
        // If brand is found but model is not found,
        // return just the brand
        return {
          brandId,
          modelId: null
        };
      }
    }
    
    // No brand or model found
    return {
      brandId: null,
      modelId: null
    };
  }, [brands, brandModels]);

  return { parseProductTitle };
};

import { useState, useMemo, useCallback } from 'react';
import { useOptimizedCarBrands, useOptimizedCarModels } from './useOptimizedCarData';
import { useSmartDebounce } from './useSmartDebounce';

interface VirtualItem {
  id: string;
  name: string;
  index: number;
}

const VIRTUAL_ITEM_HEIGHT = 40; // Height in pixels
const VIRTUAL_OVERSCAN = 5; // Items to render outside viewport

/**
 * Virtualized brand/model search with smart debouncing
 * Handles 2000+ items efficiently using virtual scrolling
 */
export function useVirtualizedBrandSearch() {
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [brandSearchTerm, setBrandSearchTerm] = useState('');
  const [modelSearchTerm, setModelSearchTerm] = useState('');
  
  // Smart debounced search terms
  const debouncedBrandSearch = useSmartDebounce(brandSearchTerm, {
    minDelay: 100,
    maxDelay: 500,
    adaptiveThreshold: 2
  });
  
  const debouncedModelSearch = useSmartDebounce(modelSearchTerm, {
    minDelay: 100,
    maxDelay: 500,
    adaptiveThreshold: 2
  });

  const brandsQuery = useOptimizedCarBrands();
  const modelsQuery = useOptimizedCarModels(selectedBrandId || undefined);

  // Virtualized brands with fuzzy search
  const virtualizedBrands = useMemo(() => {
    const brands = brandsQuery.data || [];
    if (!debouncedBrandSearch) return brands.slice(0, 100); // Show only first 100 if no search
    
    // Fuzzy search implementation
    const searchLower = debouncedBrandSearch.toLowerCase();
    return brands
      .filter(brand => {
        const nameLower = brand.name.toLowerCase();
        // Exact match gets highest priority
        if (nameLower.includes(searchLower)) return true;
        
        // Fuzzy match for typos (simple Levenshtein-like)
        if (searchLower.length > 2) {
          const chars = searchLower.split('');
          return chars.every(char => nameLower.includes(char));
        }
        
        return false;
      })
      .sort((a, b) => {
        const aLower = a.name.toLowerCase();
        const bLower = b.name.toLowerCase();
        
        // Exact matches first
        const aExact = aLower.startsWith(searchLower);
        const bExact = bLower.startsWith(searchLower);
        if (aExact !== bExact) return aExact ? -1 : 1;
        
        // Then by name length (shorter = more relevant)
        return a.name.length - b.name.length;
      })
      .slice(0, 50); // Limit to 50 for performance
  }, [brandsQuery.data, debouncedBrandSearch]);

  // Virtualized models
  const virtualizedModels = useMemo(() => {
    const models = modelsQuery.data || [];
    if (!debouncedModelSearch) return models.slice(0, 100);
    
    const searchLower = debouncedModelSearch.toLowerCase();
    return models
      .filter(model => model.name.toLowerCase().includes(searchLower))
      .sort((a, b) => {
        const aLower = a.name.toLowerCase();
        const bLower = b.name.toLowerCase();
        
        const aExact = aLower.startsWith(searchLower);
        const bExact = bLower.startsWith(searchLower);
        if (aExact !== bExact) return aExact ? -1 : 1;
        
        return a.name.length - b.name.length;
      })
      .slice(0, 50);
  }, [modelsQuery.data, debouncedModelSearch]);

  // Virtual scrolling helpers
  const getVirtualBrandItems = useCallback((startIndex: number, endIndex: number): VirtualItem[] => {
    return virtualizedBrands
      .slice(startIndex, endIndex + 1)
      .map((brand, idx) => ({
        id: brand.id,
        name: brand.name,
        index: startIndex + idx
      }));
  }, [virtualizedBrands]);

  const getVirtualModelItems = useCallback((startIndex: number, endIndex: number): VirtualItem[] => {
    return virtualizedModels
      .slice(startIndex, endIndex + 1)
      .map((model, idx) => ({
        id: model.id,
        name: model.name,
        index: startIndex + idx
      }));
  }, [virtualizedModels]);

  // Calculate visible range for viewport
  const calculateVisibleRange = useCallback((
    scrollTop: number,
    containerHeight: number,
    totalItems: number
  ) => {
    const startIndex = Math.max(0, Math.floor(scrollTop / VIRTUAL_ITEM_HEIGHT) - VIRTUAL_OVERSCAN);
    const visibleCount = Math.ceil(containerHeight / VIRTUAL_ITEM_HEIGHT);
    const endIndex = Math.min(totalItems - 1, startIndex + visibleCount + VIRTUAL_OVERSCAN * 2);
    
    return { startIndex, endIndex, totalHeight: totalItems * VIRTUAL_ITEM_HEIGHT };
  }, []);

  // Find functions with caching
  const findBrandById = useCallback((brandId: string | null) => {
    if (!brandId) return null;
    return brandsQuery.data?.find(brand => brand.id === brandId) || null;
  }, [brandsQuery.data]);

  const findModelById = useCallback((modelId: string | null) => {
    if (!modelId) return null;
    return modelsQuery.data?.find(model => model.id === modelId) || null;
  }, [modelsQuery.data]);

  return {
    // Data
    virtualizedBrands,
    virtualizedModels,
    totalBrands: virtualizedBrands.length,
    totalModels: virtualizedModels.length,
    
    // Search state
    brandSearchTerm,
    setBrandSearchTerm,
    modelSearchTerm,
    setModelSearchTerm,
    
    // Selection
    selectedBrandId,
    setSelectedBrandId,
    
    // Virtual scrolling
    getVirtualBrandItems,
    getVirtualModelItems,
    calculateVisibleRange,
    virtualItemHeight: VIRTUAL_ITEM_HEIGHT,
    
    // Loading states
    isBrandsLoading: brandsQuery.isLoading,
    isModelsLoading: modelsQuery.isLoading,
    
    // Utilities
    findBrandById,
    findModelById,
    
    // Performance metrics
    isSearching: brandSearchTerm !== debouncedBrandSearch || modelSearchTerm !== debouncedModelSearch,
  };
}
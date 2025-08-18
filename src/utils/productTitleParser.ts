
type Brand = { id: string; name: string };
type Model = { id: string; name: string; brand_id: string };

/**
 * Парсит заголовок товара и извлекает бренд и модель
 * Обычная утилитарная функция без React хуков
 */
export const parseProductTitle = (
  title: string,
  brands: Brand[],
  brandModels: Model[]
): { brandId: string | null; modelId: string | null } => {
  if (!title || brands.length === 0) {
    return { brandId: null, modelId: null };
  }
  
  const lowerTitle = title.toLowerCase();
  const sortedBrands = [...brands].sort((a, b) => b.name.length - a.name.length);

  for (const brand of sortedBrands) {
    const brandNameLower = brand.name.toLowerCase();
    if (lowerTitle.includes(brandNameLower)) {
      const brandId = brand.id;
      const relevantModels = brandModels.filter(model => model.brand_id === brandId);
      const sortedModels = [...relevantModels].sort((a, b) => b.name.length - a.name.length);
      
      for (const model of sortedModels) {
        const modelNameLower = model.name.toLowerCase();
        if (lowerTitle.includes(modelNameLower)) {
          return { brandId, modelId: model.id };
        }
      }
      return { brandId, modelId: null };
    }
  }
  
  return { brandId: null, modelId: null };
};

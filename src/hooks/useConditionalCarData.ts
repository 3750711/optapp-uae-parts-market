
import { useLocation } from 'react-router-dom';
import { useCarBrandsAndModels } from './useCarBrandsAndModels';
import { useState, useEffect } from 'react';

// Список путей где должны загружаться автомобильные данные
const CAR_DATA_PATHS = [
  '/catalog',
  '/seller/add-product',
  '/admin/add-product',
  '/admin/create-order',
  '/seller/create-order',
  '/buyer/create-order',
  '/admin/free-order',
  '/admin/order'
];

export const useConditionalCarData = () => {
  const location = useLocation();
  const [shouldLoadData, setShouldLoadData] = useState(false);
  
  // Проверяем, нужно ли загружать данные на текущем пути
  useEffect(() => {
    const shouldLoad = CAR_DATA_PATHS.some(path => location.pathname.startsWith(path));
    setShouldLoadData(shouldLoad);
  }, [location.pathname]);
  
  // Используем хук загрузки автомобильных данных с условным включением
  const {
    brands,
    brandModels,
    selectedBrandId,
    setSelectedBrandId,
    isLoadingBrands,
    isLoadingModels,
    findBrandNameById,
    findModelNameById,
    brandSearchTerm,
    setBrandSearchTerm,
    modelSearchTerm,
    setModelSearchTerm,
    brandsPage,
    setBrandsPage,
    modelsPage,
    setModelsPage,
    hasMoreBrands,
    hasMoreModels
  } = useCarBrandsAndModels();
  
  return {
    shouldLoadCarData: shouldLoadData,
    brands: shouldLoadData ? brands : [],
    brandModels: shouldLoadData ? brandModels : [],
    selectedBrand: selectedBrandId,
    selectBrand: setSelectedBrandId,
    isLoadingBrands: shouldLoadData && isLoadingBrands,
    isLoadingModels: shouldLoadData && isLoadingModels,
    findBrandNameById,
    findModelNameById,
    brandSearchTerm,
    setBrandSearchTerm,
    modelSearchTerm,
    setModelSearchTerm,
    brandsPage,
    setBrandsPage,
    modelsPage,
    setModelsPage,
    hasMoreBrands,
    hasMoreModels
  };
};

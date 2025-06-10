
import { useLocation } from 'react-router-dom';
import { useCarBrandsAndModels } from './useCarBrandsAndModels';
import { useState, useEffect } from 'react';

// Список путей где должны загружаться автомобильные данные
const CAR_DATA_PATHS = [
  '/catalog',
  '/admin/car-catalog',
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
  const carData = useCarBrandsAndModels();
  
  return {
    shouldLoadCarData: shouldLoadData,
    brands: shouldLoadData ? carData.brands : [],
    brandModels: shouldLoadData ? carData.brandModels : [],
    allModels: shouldLoadData ? carData.allModels : [], // Proxy allModels
    selectedBrandId: carData.selectedBrandId,
    selectedBrand: carData.selectedBrand, // Proxy alias
    setSelectedBrandId: carData.setSelectedBrandId,
    selectBrand: carData.selectBrand, // Proxy alias
    isLoadingBrands: shouldLoadData && carData.isLoadingBrands,
    isLoadingModels: shouldLoadData && carData.isLoadingModels,
    isLoading: shouldLoadData && carData.isLoading, // Proxy combined loading state
    findBrandNameById: carData.findBrandNameById,
    findModelNameById: carData.findModelNameById,
    findBrandIdByName: carData.findBrandIdByName, // Proxy new function
    findModelIdByName: carData.findModelIdByName, // Proxy new function
    validateModelBrand: carData.validateModelBrand, // Proxy new function
    brandSearchTerm: carData.brandSearchTerm,
    setBrandSearchTerm: carData.setBrandSearchTerm,
    modelSearchTerm: carData.modelSearchTerm,
    setModelSearchTerm: carData.setModelSearchTerm,
    brandsPage: carData.brandsPage,
    setBrandsPage: carData.setBrandsPage,
    modelsPage: carData.modelsPage,
    setModelsPage: carData.setModelsPage,
    hasMoreBrands: carData.hasMoreBrands,
    hasMoreModels: carData.hasMoreModels
  };
};

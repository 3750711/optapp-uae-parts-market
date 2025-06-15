import { useLocation } from 'react-router-dom';
import { useAllCarBrands } from './useAllCarBrands';
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
  const carData = useAllCarBrands();
  
  return {
    shouldLoadCarData: shouldLoadData,
    brands: shouldLoadData ? carData.brands : [],
    brandModels: shouldLoadData ? carData.brandModels : [],
    allModels: shouldLoadData ? carData.allModels : [],
    selectedBrand: shouldLoadData ? carData.selectedBrand : null,
    selectBrand: shouldLoadData ? carData.selectBrand : () => {},
    isLoading: shouldLoadData ? carData.isLoading : false,
    findBrandNameById: carData.findBrandNameById,
    findModelNameById: carData.findModelNameById,
    findBrandIdByName: carData.findBrandIdByName,
    findModelIdByName: carData.findModelIdByName,
    validateModelBrand: carData.validateModelBrand,
    brandSearchTerm: shouldLoadData ? carData.brandSearchTerm : '',
    setBrandSearchTerm: shouldLoadData ? carData.setBrandSearchTerm : () => {},
    modelSearchTerm: shouldLoadData ? carData.modelSearchTerm : '',
    setModelSearchTerm: shouldLoadData ? carData.setModelSearchTerm : () => {},
    brandsPage: 1, // Placeholder, assuming not used with AllCarBrands
    setBrandsPage: () => {}, // Placeholder
    modelsPage: 1, // Placeholder
    setModelsPage: () => {}, // Placeholder
    hasMoreBrands: false, // Placeholder
    hasMoreModels: false // Placeholder
  };
};

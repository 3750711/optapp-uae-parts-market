
import { useCarBrandsAndModels } from './useCarBrandsAndModels';
import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';

// Страницы где нужны автомобильные данные
const CAR_DATA_ROUTES = [
  '/catalog',
  '/seller/add-product',
  '/admin/add-product',
  '/admin/create-order-from-product',
  '/seller/create-order',
  '/buyer/create-order',
  '/admin/free-order'
];

/**
 * Условный хук для загрузки автомобильных данных
 * Загружает данные только на страницах где они действительно нужны
 */
export const useConditionalCarData = () => {
  const location = useLocation();
  
  // Определяем нужно ли загружать автомобильные данные
  const shouldLoadCarData = useMemo(() => {
    return CAR_DATA_ROUTES.some(route => 
      location.pathname.startsWith(route) || 
      location.pathname.includes('/admin/create-order/') // динамические роуты
    );
  }, [location.pathname]);

  // Загружаем данные только если нужно
  const carDataHook = useCarBrandsAndModels();
  
  // Если данные не нужны, возвращаем пустые массивы и состояние "не загружается"
  if (!shouldLoadCarData) {
    return {
      brands: [],
      allModels: [],
      brandModels: [],
      selectedBrand: null,
      selectBrand: () => {},
      isLoading: false,
      error: null,
      findBrandIdByName: () => null,
      findModelIdByName: () => null,
      findBrandNameById: () => null,
      findModelNameById: () => null,
      validateModelBrand: () => false,
      shouldLoadCarData: false
    };
  }

  return {
    ...carDataHook,
    shouldLoadCarData: true
  };
};

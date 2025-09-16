
import { supabase } from '@/integrations/supabase/client';
import { normalizeDecimal } from '@/utils/number';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sellerId?: string;
  buyerId?: string;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  columnMapping: Record<string, string>;
  sampleData: any[];
}

// Расширенный mapping различных названий столбцов к стандартным полям
const COLUMN_MAPPINGS = {
  title: ['Title', 'Название', 'Name', 'Product Name', 'title'],
  price: ['Price', 'Цена', 'Cost', 'Amount', 'price'],
  orderNumber: ['Order Number', 'Номер заказа', 'Number', 'Order#', 'order number'],
  places: ['Places', 'Количество мест', 'Quantity', 'Qty', 'places'],
  deliveryPrice: ['Цена доставки', 'Delivery Price', 'Shipping Cost', 'Доставка', 'цена доставки'],
  sellerId: ['Seller ID', 'ID продавца', 'Seller', 'SellerID', 'seller id'],
  buyerId: ['Buyer ID', 'ID покупателя', 'Buyer', 'BuyerID', 'buyer id'],
  brand: ['Brand', 'Бренд', 'Марка', 'brand'],
  model: ['Model', 'Модель', 'model'],
  description: ['Description', 'Дополнительная информация', 'Info', 'Details', 'description']
};

// Функция для нормализации opt_id
const normalizeOptId = (optId: string): string => {
  return optId.toString().trim().toLowerCase();
};

// Функция для проверки является ли заказ долговым
const isDebtOrder = (title: string): boolean => {
  return title && title.toLowerCase().includes('(долг)');
};

export const validateExcelFile = (data: any[]): FileValidationResult => {
  const errors: string[] = [];
  
  console.log('Валидация Excel файла. Данные:', data);
  
  if (!data || data.length === 0) {
    return {
      isValid: false,
      errors: ['Файл пустой или не содержит данных'],
      columnMapping: {},
      sampleData: []
    };
  }

  // Получаем заголовки из первой строки
  const headers = Object.keys(data[0] || {});
  console.log('Найденные заголовки:', headers);

  if (headers.length === 0) {
    return {
      isValid: false,
      errors: ['Не найдены заголовки столбцов'],
      columnMapping: {},
      sampleData: []
    };
  }

  // Создаем mapping столбцов с нечувствительным к регистру поиском
  const columnMapping: Record<string, string> = {};
  
  Object.entries(COLUMN_MAPPINGS).forEach(([standardField, variants]) => {
    const foundHeader = headers.find(header => 
      variants.some(variant => 
        header.toLowerCase().trim() === variant.toLowerCase().trim()
      )
    );
    
    if (foundHeader) {
      columnMapping[standardField] = foundHeader;
    }
  });

  console.log('Создан mapping столбцов:', columnMapping);

  // Проверяем обязательные поля
  const requiredFields = ['title', 'sellerId', 'buyerId'];
  const missingFields = requiredFields.filter(field => !columnMapping[field]);

  if (missingFields.length > 0) {
    const missingMappings = missingFields.map(field => {
      const expectedNames = COLUMN_MAPPINGS[field as keyof typeof COLUMN_MAPPINGS];
      return `${field} (ожидается: ${expectedNames.join(', ')})`;
    });
    
    console.log('Отсутствующие поля:', missingFields);
    console.log('Доступные заголовки:', headers);
    console.log('Текущий mapping:', columnMapping);
    
    errors.push(`Отсутствуют обязательные столбцы: ${missingMappings.join('; ')}`);
    errors.push(`Найденные заголовки в файле: ${headers.join(', ')}`);
  }

  // Берем первые 3 строки как образец
  const sampleData = data.slice(0, 3);

  return {
    isValid: errors.length === 0,
    errors,
    columnMapping,
    sampleData
  };
};

export const validateImportRow = async (
  row: Record<string, any>, 
  rowNumber: number,
  usersCache: Map<string, string>,
  columnMapping: Record<string, string>
): Promise<ValidationResult> => {
  const errors: string[] = [];
  const warnings: string[] = [];
  let sellerId: string | undefined;
  let buyerId: string | undefined;

  console.log(`Валидация строки ${rowNumber}:`, row);
  console.log('Используемый mapping:', columnMapping);

  // Validate required fields используя mapping
  const title = row[columnMapping.title] || '';
  if (!title || title.toString().trim() === '') {
    errors.push('Отсутствует название заказа');
  }

  // Изменена валидация цены для поддержки долговых заказов
  const priceValue = row[columnMapping.price] || '0';
  const price = normalizeDecimal(priceValue.toString().replace(/[^\d.,]/g, '').replace(',', '.'));
  
  // Проверяем является ли заказ долговым
  const isDebt = isDebtOrder(title);
  
  if (isNaN(price)) {
    errors.push('Некорректная цена товара');
  } else if (price <= 0 && !isDebt) {
    // Для обычных заказов цена должна быть больше 0
    errors.push('Цена товара должна быть больше 0');
  } else if (price === 0 && isDebt) {
    // Для долговых заказов нулевая цена допустима, добавляем предупреждение
    warnings.push('Долговой заказ с нулевой ценой');
  }

  const sellerOptId = row[columnMapping.sellerId] || '';
  const buyerOptId = row[columnMapping.buyerId] || '';

  if (!sellerOptId || sellerOptId.toString().trim() === '') {
    errors.push('Отсутствует ID продавца');
  } else {
    // Нормализуем opt_id для поиска
    const normalizedSellerOptId = normalizeOptId(sellerOptId);
    const cacheKey = `seller_${normalizedSellerOptId}`;
    
    console.log(`Поиск продавца: исходный="${sellerOptId}", нормализованный="${normalizedSellerOptId}", ключ кэша="${cacheKey}"`);
    
    if (usersCache.has(cacheKey)) {
      sellerId = usersCache.get(cacheKey);
      console.log(`Продавец найден в кэше: ${sellerId}`);
    } else {
      console.log(`Продавец не найден в кэше. Доступные ключи:`, Array.from(usersCache.keys()));
      errors.push(`Продавец с ID "${sellerOptId}" не найден`);
    }
  }

  if (!buyerOptId || buyerOptId.toString().trim() === '') {
    errors.push('Отсутствует ID покупателя');
  } else {
    // Нормализуем opt_id для поиска
    const normalizedBuyerOptId = normalizeOptId(buyerOptId);
    const cacheKey = `buyer_${normalizedBuyerOptId}`;
    
    console.log(`Поиск покупателя: исходный="${buyerOptId}", нормализованный="${normalizedBuyerOptId}", ключ кэша="${cacheKey}"`);
    
    if (usersCache.has(cacheKey)) {
      buyerId = usersCache.get(cacheKey);
      console.log(`Покупатель найден в кэше: ${buyerId}`);
    } else {
      console.log(`Покупатель не найден в кэше. Доступные ключи:`, Array.from(usersCache.keys()));
      errors.push(`Покупатель с ID "${buyerOptId}" не найден`);
    }
  }

  // Validate places
  const placesValue = row[columnMapping.places] || '1';
  const places = parseInt(placesValue.toString());
  if (isNaN(places) || places <= 0) {
    warnings.push('Некорректное количество мест, будет использовано значение 1');
  }

  // Validate delivery price
  const deliveryPriceValue = row[columnMapping.deliveryPrice] || '0';
  const deliveryPrice = normalizeDecimal(deliveryPriceValue.toString().replace(/[^\d.,]/g, '').replace(',', '.'));
  if (deliveryPrice < 0) {
    warnings.push('Некорректная цена доставки, будет использовано значение 0');
  }

  // Validate order number
  const orderNumberValue = row[columnMapping.orderNumber] || '0';
  const orderNumber = parseInt(orderNumberValue.toString());
  if (orderNumber > 0) {
    // Check if order number already exists
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('order_number', orderNumber)
      .single();
    
    if (existingOrder) {
      warnings.push(`Заказ с номером ${orderNumber} уже существует`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sellerId,
    buyerId
  };
};

export const buildUsersCache = async (data: any[], columnMapping: Record<string, string>): Promise<{
  cache: Map<string, string>;
  missingUsers: { sellers: string[]; buyers: string[] };
}> => {
  const cache = new Map<string, string>();
  const sellerOptIds = new Set<string>();
  const buyerOptIds = new Set<string>();

  // Собираем все уникальные opt_ids с нормализацией
  data.forEach(row => {
    const sellerOptId = row[columnMapping.sellerId];
    const buyerOptId = row[columnMapping.buyerId];
    
    if (sellerOptId && sellerOptId.toString().trim()) {
      const normalized = normalizeOptId(sellerOptId);
      sellerOptIds.add(normalized);
    }
    if (buyerOptId && buyerOptId.toString().trim()) {
      const normalized = normalizeOptId(buyerOptId);
      buyerOptIds.add(normalized);
    }
  });

  console.log('Собранные seller opt_ids:', Array.from(sellerOptIds));
  console.log('Собранные buyer opt_ids:', Array.from(buyerOptIds));

  // Получаем всех пользователей одним запросом
  const allOptIds = [...Array.from(sellerOptIds), ...Array.from(buyerOptIds)];
  
  if (allOptIds.length > 0) {
    console.log('Поиск пользователей по opt_ids:', allOptIds);
    
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, opt_id')
      .not('opt_id', 'is', null);

    if (error) {
      console.error('Ошибка при получении пользователей:', error);
    } else {
      console.log('Найдено пользователей в БД:', users?.length || 0);
      console.log('Первые 5 пользователей:', users?.slice(0, 5));
    }

    // Строим кэш с нормализованными opt_id
    users?.forEach(user => {
      if (user.opt_id) {
        const normalizedOptId = normalizeOptId(user.opt_id);
        console.log(`Обработка пользователя: исходный opt_id="${user.opt_id}", нормализованный="${normalizedOptId}"`);
        
        if (sellerOptIds.has(normalizedOptId)) {
          const cacheKey = `seller_${normalizedOptId}`;
          cache.set(cacheKey, user.id);
          console.log(`Добавлен продавец в кэш: ${cacheKey} -> ${user.id}`);
        }
        if (buyerOptIds.has(normalizedOptId)) {
          const cacheKey = `buyer_${normalizedOptId}`;
          cache.set(cacheKey, user.id);
          console.log(`Добавлен покупатель в кэш: ${cacheKey} -> ${user.id}`);
        }
      }
    });
  }

  console.log('Итоговый кэш пользователей:', Array.from(cache.entries()));

  // Находим отсутствующих пользователей
  const foundSellerIds = new Set(
    Array.from(cache.keys())
      .filter(key => key.startsWith('seller_'))
      .map(key => key.replace('seller_', ''))
  );
  const foundBuyerIds = new Set(
    Array.from(cache.keys())
      .filter(key => key.startsWith('buyer_'))
      .map(key => key.replace('buyer_', ''))
  );

  const missingSellers = Array.from(sellerOptIds).filter(id => !foundSellerIds.has(id));
  const missingBuyers = Array.from(buyerOptIds).filter(id => !foundBuyerIds.has(id));

  console.log('Отсутствующие продавцы:', missingSellers);
  console.log('Отсутствующие покупатели:', missingBuyers);

  return {
    cache,
    missingUsers: {
      sellers: missingSellers,
      buyers: missingBuyers
    }
  };
};

export const createMissingUser = async (optId: string, userType: 'seller' | 'buyer'): Promise<string | null> => {
  try {
    // Нормализуем opt_id при создании пользователя
    const normalizedOptId = normalizeOptId(optId);
    
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        opt_id: normalizedOptId,
        full_name: `Импорт ${userType} ${normalizedOptId}`,
        email: `import_${userType}_${normalizedOptId}@temp.local`,
        user_type: userType,
        verification_status: 'pending'
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return null;
    }

    console.log(`Создан пользователь: opt_id="${normalizedOptId}", id="${data.id}"`);
    return data.id;
  } catch (error) {
    console.error('Exception creating user:', error);
    return null;
  }
};

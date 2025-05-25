import { supabase } from '@/integrations/supabase/client';

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
  const requiredFields = ['title', 'price', 'sellerId', 'buyerId'];
  const missingFields = requiredFields.filter(field => !columnMapping[field]);

  if (missingFields.length > 0) {
    const missingMappings = missingFields.map(field => {
      const expectedNames = COLUMN_MAPPINGS[field as keyof typeof COLUMN_MAPPINGS];
      return `${field} (ожидается: ${expectedNames.join(', ')})`;
    });
    
    // Добавим дополнительную диагностику
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

  const priceValue = row[columnMapping.price] || '0';
  const price = parseFloat(priceValue.toString().replace(/[^\d.,]/g, '').replace(',', '.'));
  if (isNaN(price) || price <= 0) {
    errors.push('Некорректная цена товара');
  }

  const sellerOptId = row[columnMapping.sellerId] || '';
  const buyerOptId = row[columnMapping.buyerId] || '';

  if (!sellerOptId || sellerOptId.toString().trim() === '') {
    errors.push('Отсутствует ID продавца');
  } else {
    // Check if seller exists in cache
    if (usersCache.has(`seller_${sellerOptId}`)) {
      sellerId = usersCache.get(`seller_${sellerOptId}`);
    } else {
      errors.push(`Продавец с ID "${sellerOptId}" не найден`);
    }
  }

  if (!buyerOptId || buyerOptId.toString().trim() === '') {
    errors.push('Отсутствует ID покупателя');
  } else {
    // Check if buyer exists in cache
    if (usersCache.has(`buyer_${buyerOptId}`)) {
      buyerId = usersCache.get(`buyer_${buyerOptId}`);
    } else {
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
  const deliveryPrice = parseFloat(deliveryPriceValue.toString().replace(/[^\d.,]/g, '').replace(',', '.'));
  if (isNaN(deliveryPrice)) {
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

  // Collect all unique opt_ids используя правильные названия столбцов
  data.forEach(row => {
    const sellerOptId = row[columnMapping.sellerId];
    const buyerOptId = row[columnMapping.buyerId];
    
    if (sellerOptId && sellerOptId.toString().trim()) {
      sellerOptIds.add(sellerOptId.toString().trim());
    }
    if (buyerOptId && buyerOptId.toString().trim()) {
      buyerOptIds.add(buyerOptId.toString().trim());
    }
  });

  // Fetch all users at once
  const allOptIds = [...Array.from(sellerOptIds), ...Array.from(buyerOptIds)];
  
  if (allOptIds.length > 0) {
    const { data: users } = await supabase
      .from('profiles')
      .select('id, opt_id')
      .in('opt_id', allOptIds);

    // Build cache
    users?.forEach(user => {
      if (user.opt_id) {
        if (sellerOptIds.has(user.opt_id)) {
          cache.set(`seller_${user.opt_id}`, user.id);
        }
        if (buyerOptIds.has(user.opt_id)) {
          cache.set(`buyer_${user.opt_id}`, user.id);
        }
      }
    });
  }

  // Find missing users
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
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        opt_id: optId,
        full_name: `Импорт ${userType} ${optId}`,
        email: `import_${userType}_${optId}@temp.local`,
        user_type: userType,
        verification_status: 'pending'
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Exception creating user:', error);
    return null;
  }
};

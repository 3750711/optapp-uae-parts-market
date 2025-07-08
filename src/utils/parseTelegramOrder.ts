import { useLazyProfiles } from '@/hooks/useLazyProfiles';

export interface ParsedTelegramOrder {
  title: string;
  place_number: string;
  price: string;
  delivery_price?: string;
  buyerOptId: string;
  sellerOptId: string;
  brand?: string;
  model?: string;
}

export interface ParseResult {
  success: boolean;
  data?: ParsedTelegramOrder;
  errors: string[];
  warnings: string[];
}

/**
 * Список известных автомобильных брендов для парсинга
 */
const CAR_BRANDS = [
  'Toyota', 'Honda', 'Nissan', 'Mazda', 'Subaru', 'Mitsubishi', 'Suzuki', 'Isuzu',
  'BMW', 'Mercedes', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Porsche', 'Opel',
  'Ford', 'Chevrolet', 'Cadillac', 'Buick', 'GMC', 'Lincoln',
  'Hyundai', 'Kia', 'Genesis', 'SsangYong',
  'Lexus', 'Infiniti', 'Acura',
  'Volvo', 'Saab', 'Peugeot', 'Citroen', 'Renault',
  'Fiat', 'Alfa Romeo', 'Lancia',
  'Skoda', 'Seat',
  'Jaguar', 'Land Rover', 'Range Rover', 'Mini',
  'Lada', 'VAZ', 'GAZ', 'UAZ'
];

/**
 * Извлекает бренд и модель из названия товара
 */
export function extractBrandAndModel(title: string): { brand?: string; model?: string } {
  const words = title.split(/\s+/);
  let brand: string | undefined;
  let model: string | undefined;

  // Ищем бренд в названии
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const foundBrand = CAR_BRANDS.find(b => 
      b.toLowerCase() === word.toLowerCase()
    );
    
    if (foundBrand) {
      brand = foundBrand;
      // Следующее слово может быть моделью
      if (i + 1 < words.length) {
        model = words[i + 1];
      }
      break;
    }
  }

  return { brand, model };
}

/**
 * Парсит telegram сообщение и извлекает данные заказа
 */
export function parseTelegramOrder(text: string): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Очищаем текст от лишних символов и нормализуем переносы строк
    const cleanText = text.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Извлекаем наименование
    const titleMatch = cleanText.match(/Наименование:\s*(.+?)(?=\n|$)/i);
    if (!titleMatch) {
      errors.push('Не найдено наименование товара');
      return { success: false, errors, warnings };
    }
    const title = titleMatch[1].trim();

    // Извлекаем количество мест
    const placesMatch = cleanText.match(/Количество мест:\s*(\d+)/i);
    if (!placesMatch) {
      errors.push('Не найдено количество мест');
      return { success: false, errors, warnings };
    }
    const place_number = placesMatch[1];

    // Извлекаем стоимость
    const priceMatch = cleanText.match(/Стоимость:\s*(\d+(?:\.\d+)?)\$/i);
    if (!priceMatch) {
      errors.push('Не найдена стоимость товара');
      return { success: false, errors, warnings };
    }
    const price = priceMatch[1];

    // Извлекаем стоимость доставки (опционально)
    const deliveryPriceMatch = cleanText.match(/Стоимость доставки:\s*(\d+(?:\.\d+)?)\$/i);
    const delivery_price = deliveryPriceMatch ? deliveryPriceMatch[1] : undefined;

    // Извлекаем OPT_ID (последние две строки)
    const lines = cleanText.split('\n').filter(line => line.trim());
    const lastTwoLines = lines.slice(-2);
    
    if (lastTwoLines.length < 2) {
      errors.push('Не найдены OPT_ID покупателя и продавца');
      return { success: false, errors, warnings };
    }

    const buyerOptId = lastTwoLines[0].trim();
    const sellerOptId = lastTwoLines[1].trim();

    if (!buyerOptId || !sellerOptId) {
      errors.push('OPT_ID покупателя или продавца пусты');
      return { success: false, errors, warnings };
    }

    // Извлекаем бренд и модель из названия
    const { brand, model } = extractBrandAndModel(title);
    
    if (!brand) {
      warnings.push('Не удалось автоматически определить бренд автомобиля');
    }
    if (!model) {
      warnings.push('Не удалось автоматически определить модель автомобиля');
    }

    const result: ParsedTelegramOrder = {
      title,
      place_number,
      price,
      delivery_price,
      buyerOptId,
      sellerOptId,
      brand,
      model
    };

    return {
      success: true,
      data: result,
      errors,
      warnings
    };

  } catch (error) {
    errors.push(`Ошибка парсинга: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    return { success: false, errors, warnings };
  }
}

/**
 * Проверяет валидность распознанных данных
 */
export function validateParsedOrder(data: ParsedTelegramOrder): string[] {
  const errors: string[] = [];

  if (!data.title.trim()) {
    errors.push('Наименование товара не может быть пустым');
  }

  const placeNumber = parseInt(data.place_number);
  if (isNaN(placeNumber) || placeNumber <= 0) {
    errors.push('Количество мест должно быть положительным числом');
  }

  const price = parseFloat(data.price);
  if (isNaN(price) || price <= 0) {
    errors.push('Стоимость должна быть положительным числом');
  }

  if (data.delivery_price) {
    const deliveryPrice = parseFloat(data.delivery_price);
    if (isNaN(deliveryPrice) || deliveryPrice < 0) {
      errors.push('Стоимость доставки должна быть неотрицательным числом');
    }
  }

  if (!data.buyerOptId.trim()) {
    errors.push('OPT_ID покупателя не может быть пустым');
  }

  if (!data.sellerOptId.trim()) {
    errors.push('OPT_ID продавца не может быть пустым');
  }

  return errors;
}
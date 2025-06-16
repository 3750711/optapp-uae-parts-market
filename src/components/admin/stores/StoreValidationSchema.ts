
import { z } from 'zod';
import { StoreTag } from '@/types/store';

export const storeEditSchema = z.object({
  name: z.string()
    .min(2, 'Название должно содержать минимум 2 символа')
    .max(100, 'Название не должно превышать 100 символов')
    .regex(/^[a-zA-Zа-яА-Я0-9\s\-_.,]+$/, 'Название содержит недопустимые символы'),
    
  description: z.string()
    .max(1000, 'Описание не должно превышать 1000 символов')
    .optional()
    .nullable(),
    
  address: z.string()
    .min(5, 'Адрес должен содержать минимум 5 символов')
    .max(200, 'Адрес не должен превышать 200 символов'),
    
  location: z.string()
    .min(2, 'Город должен содержать минимум 2 символа')
    .max(50, 'Город не должен превышать 50 символов')
    .optional()
    .nullable(),
    
  phone: z.string()
    .regex(/^(\+971|971|0)?[0-9]{8,9}$/, 'Неверный формат телефона (ОАЭ)')
    .optional()
    .nullable()
    .or(z.literal('')),
    
  owner_name: z.string()
    .min(2, 'Имя владельца должно содержать минимум 2 символа')
    .max(100, 'Имя владельца не должно превышать 100 символов')
    .regex(/^[a-zA-Zа-яА-Я\s\-']+$/, 'Имя может содержать только буквы, пробелы и дефисы')
    .optional()
    .nullable(),
    
  telegram: z.string()
    .regex(/^(https:\/\/t\.me\/|@)?[a-zA-Z0-9_]{5,32}$/, 'Неверный формат Telegram (@username или https://t.me/username)')
    .optional()
    .nullable()
    .or(z.literal('')),
    
  tags: z.array(z.enum(['electronics', 'auto_parts', 'accessories', 'spare_parts', 'other']))
    .max(5, 'Можно выбрать максимум 5 тегов')
    .optional(),
    
  verified: z.boolean(),
  
  selectedCarBrands: z.array(z.string().uuid('Неверный формат ID бренда'))
    .max(20, 'Можно выбрать максимум 20 брендов'),
    
  selectedCarModels: z.record(
    z.string().uuid(),
    z.array(z.string().uuid()).max(50, 'Слишком много моделей для одного бренда')
  )
});

export type StoreEditFormData = z.infer<typeof storeEditSchema>;

export const validateStoreImages = (images: any[]) => {
  const errors: string[] = [];
  
  if (images.length > 10) {
    errors.push('Максимум 10 изображений на магазин');
  }
  
  images.forEach((image, index) => {
    if (typeof image.url !== 'string' || !image.url.startsWith('http')) {
      errors.push(`Изображение ${index + 1}: неверный URL`);
    }
  });
  
  return errors;
};

export const sanitizeStoreData = (data: any): Partial<StoreEditFormData> => {
  return {
    name: data.name?.trim(),
    description: data.description?.trim() || null,
    address: data.address?.trim(),
    location: data.location?.trim() || null,
    phone: data.phone?.replace(/\D/g, '') || null,
    owner_name: data.owner_name?.trim() || null,
    telegram: data.telegram?.trim().replace(/^@/, '').replace(/^https:\/\/t\.me\//, '') || null,
    tags: Array.isArray(data.tags) ? data.tags : [],
    verified: Boolean(data.verified),
    selectedCarBrands: Array.isArray(data.selectedCarBrands) ? data.selectedCarBrands : [],
    selectedCarModels: typeof data.selectedCarModels === 'object' ? data.selectedCarModels : {}
  };
};


import { z } from 'zod';

// Безопасные схемы валидации для продакшена
export const productValidationSchema = z.object({
  title: z.string()
    .min(1, 'Название обязательно')
    .max(200, 'Название слишком длинное')
    .regex(/^[^\<\>]*$/, 'Недопустимые символы в названии'),
  
  description: z.string()
    .max(2000, 'Описание слишком длинное')
    .regex(/^[^\<\>]*$/, 'Недопустимые символы в описании')
    .optional(),
  
  price: z.number()
    .min(0, 'Цена не может быть отрицательной')
    .max(1000000, 'Цена слишком высокая'),
  
  brand: z.string()
    .min(1, 'Бренд обязателен')
    .max(100, 'Название бренда слишком длинное')
    .regex(/^[a-zA-Z0-9\s\-\_]*$/, 'Недопустимые символы в бренде'),
  
  model: z.string()
    .max(100, 'Название модели слишком длинное')
    .regex(/^[a-zA-Z0-9\s\-\_]*$/, 'Недопустимые символы в модели')
    .optional(),
});

export const userProfileValidationSchema = z.object({
  full_name: z.string()
    .min(2, 'Имя слишком короткое')
    .max(100, 'Имя слишком длинное')
    .regex(/^[a-zA-Zа-яА-Я\s\-]*$/, 'Недопустимые символы в имени')
    .optional(),
  
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Неверный формат телефона')
    .optional(),
  
  telegram: z.string()
    .regex(/^[a-zA-Z0-9_]{5,32}$/, 'Неверный формат Telegram')
    .optional(),
  
  opt_id: z.string()
    .regex(/^[A-Z0-9]{6,20}$/, 'OPT ID должен содержать только заглавные буквы и цифры')
    .optional(),
});

export const orderValidationSchema = z.object({
  title: z.string()
    .min(1, 'Название заказа обязательно')
    .max(200, 'Название заказа слишком длинное')
    .regex(/^[^\<\>]*$/, 'Недопустимые символы'),
  
  price: z.number()
    .min(0, 'Цена не может быть отрицательной')
    .max(1000000, 'Цена слишком высокая'),
  
  quantity: z.number()
    .int('Количество должно быть целым числом')
    .min(1, 'Количество должно быть больше 0')
    .max(1000, 'Слишком большое количество'),
});

// Функция для безопасной очистки строк от XSS
export const sanitizeString = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Удаляем потенциально опасные символы
    .replace(/javascript:/gi, '') // Удаляем javascript: протокол
    .replace(/on\w+=/gi, '') // Удаляем event handlers
    .trim();
};

// Функция для валидации и очистки данных формы
export const validateAndSanitizeFormData = <T>(
  data: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; errors: string[] } => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      return { success: false, errors };
    }
    return { success: false, errors: ['Ошибка валидации данных'] };
  }
};

// Проверка на SQL инъекции в строках поиска
export const validateSearchQuery = (query: string): boolean => {
  const dangerousPatterns = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
    /(--|\/\*|\*\/|;)/g,
    /(\bor\b|\band\b).*[=<>]/gi
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(query));
};

// Валидация файлов
export const validateFileUpload = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'image/jpeg', 
    'image/png', 
    'image/webp',
    'video/mp4',
    'video/webm'
  ];
  
  if (file.size > maxSize) {
    return { valid: false, error: 'Файл слишком большой (максимум 10MB)' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Неподдерживаемый тип файла' };
  }
  
  return { valid: true };
};

// Проверка на безопасность URL
export const validateUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

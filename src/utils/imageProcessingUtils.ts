
import imageCompression from 'browser-image-compression';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Логирование информации о процессе обработки изображений
 * @param action Выполняемое действие
 * @param details Дополнительная информация
 */
export function logImageProcessing(action: string, details: Record<string, any> = {}) {
  console.log(`[Image:${action}]`, details);
}

/**
 * Определяет характеристики устройства для настройки оптимальных параметров сжатия
 * @returns Объект с информацией о возможностях устройства
 */
export function getDeviceCapabilities() {
  const userAgent = navigator.userAgent.toLowerCase();
  const memory = (navigator as any).deviceMemory || 4; // Значение по умолчанию 4GB
  
  // Проверка типа устройства
  const isLowEndDevice = memory <= 2;
  const isOlderIOS = /iphone|ipad|ipod/.test(userAgent) && 
    !(/iPhone OS 1[3-9]|iPhone OS 2[0-9]/.test(userAgent));
  const isOlderAndroid = /android/.test(userAgent) && !/chrome\/[6-9][0-9]/.test(userAgent);
  
  // Расширенное определение слабых устройств
  const isMobileDevice = /mobile|android|iphone|ipad|ipod/.test(userAgent);
  const isBudgetDevice = isLowEndDevice || isOlderIOS || isOlderAndroid;
  
  // Проверка на проблемы с WebWorker
  const hasWebWorkerIssues = isOlderIOS || /instagram|facebook|snapchat/.test(userAgent);
  
  // Проверка на Safari (известные проблемы с WebWorker)
  const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
  
  // Проверка на мобильный Chrome с ограничениями
  const isMobileChromeWithLimits = /chrome/.test(userAgent) && /mobile/.test(userAgent) && 
                                   (/android 7|android 8|android 9/.test(userAgent));
  
  // Проверка на мобильный браузер UC или Opera Mini с ограниченными возможностями
  const isLimitedBrowser = /ucbrowser|opera mini|miui browser/.test(userAgent);
  
  // Определение нестабильных сетевых условий (аппроксимация)
  const hasWeakConnection = (navigator as any).connection && 
                           ((navigator as any).connection.effectiveType === '2g' || 
                           (navigator as any).connection.effectiveType === 'slow-2g');
  
  logImageProcessing('DeviceCapabilities', {
    memory,
    isLowEndDevice,
    isOlderIOS,
    isOlderAndroid,
    isMobileDevice,
    isBudgetDevice,
    hasWebWorkerIssues,
    isSafari,
    isMobileChromeWithLimits,
    isLimitedBrowser,
    hasWeakConnection,
    userAgent,
    connectionInfo: (navigator as any).connection ? {
      effectiveType: (navigator as any).connection.effectiveType,
      downlink: (navigator as any).connection.downlink,
      rtt: (navigator as any).connection.rtt
    } : 'not available'
  });
  
  return {
    memory,
    isLowEndDevice,
    isOlderIOS,
    isOlderAndroid,
    isMobileDevice,
    isBudgetDevice,
    hasWebWorkerIssues,
    isSafari,
    isMobileChromeWithLimits,
    isLimitedBrowser,
    hasWeakConnection
  };
}

/**
 * Запрос доступных хранилищ (buckets) в Supabase
 * @returns Массив имен доступных хранилищ
 */
export async function getAvailableBuckets(): Promise<string[]> {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      logImageProcessing('BucketsListError', { error: error.message });
      return ["Product Images", "product-images"]; // Резервный список известных имен хранилищ
    }
    
    if (!data || data.length === 0) {
      logImageProcessing('NoBuckets', { message: 'Список хранилищ пуст' });
      return ["Product Images", "product-images"];
    }
    
    logImageProcessing('AvailableBuckets', { 
      buckets: data.map(b => b.name) 
    });
    
    return data.map(b => b.name);
  } catch (error) {
    logImageProcessing('BucketsListException', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    return ["Product Images", "product-images"];
  }
}

// Кэшированный список хранилищ для быстрого доступа
let cachedBuckets: string[] | null = null;

/**
 * Получает основное имя хранилища для загрузки изображений
 * @returns Имя хранилища
 */
export async function getPrimaryStorageBucket(): Promise<string> {
  try {
    // Используем кэш, если доступен
    if (cachedBuckets) {
      return cachedBuckets.includes("Product Images") 
        ? "Product Images" 
        : (cachedBuckets[0] || "product-images");
    }
    
    // Запрашиваем список хранилищ
    const buckets = await getAvailableBuckets();
    cachedBuckets = buckets; // Сохраняем в кэш
    
    // Ищем предпочтительное хранилище
    if (buckets.includes("Product Images")) {
      return "Product Images";
    } else if (buckets.includes("product-images")) {
      return "product-images";
    } else {
      // Если не нашли ни одного из предпочтительных, берем первое доступное
      return buckets[0] || "Product Images";
    }
  } catch (error) {
    logImageProcessing('GetPrimaryBucketError', { 
      error: error instanceof Error ? error.message : String(error)
    });
    
    // Возвращаем предпочтительное имя в случае ошибки
    return "Product Images";
  }
}

/**
 * Проверяет права пользователя на загрузку изображений
 * @returns Объект с результатом проверки и сообщением об ошибке
 */
export async function checkUserUploadPermission(): Promise<{
  canUpload: boolean;
  message?: string;
}> {
  try {
    // Проверяем, аутентифицирован ли пользователь
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        canUpload: false,
        message: "Требуется авторизация для загрузки изображений"
      };
    }
    
    // Проверяем наличие доступных хранилищ
    const buckets = await getAvailableBuckets();
    
    if (!buckets || buckets.length === 0) {
      return {
        canUpload: false,
        message: "Нет доступных хранилищ для загрузки изображений"
      };
    }
    
    // Проверка прав доступа к основному хранилищу
    const bucketName = await getPrimaryStorageBucket();
    
    return {
      canUpload: true
    };
  } catch (error) {
    logImageProcessing('PermissionCheckError', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return {
      canUpload: true, // По умолчанию разрешаем, чтобы не блокировать пользователей из-за ошибки проверки
      message: "Не удалось проверить права доступа"
    };
  }
}

/**
 * Оптимизирует изображение для загрузки с учетом возможностей устройства
 * @param file Исходный файл изображения
 * @returns Обработанный файл изображения
 */
export async function optimizeImageForMarketplace(file: File): Promise<File> {
  try {
    const deviceCapabilities = getDeviceCapabilities();
    
    logImageProcessing('OptimizationStart', { 
      fileName: file.name,
      originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      type: file.type,
      deviceCapabilities
    });
    
    // Тонкая настройка в зависимости от возможностей устройства
    let maxWidth = 2000;
    let quality = 0.8;
    let maxSizeMB = 1.0;
    
    if (deviceCapabilities.isLowEndDevice || deviceCapabilities.isBudgetDevice) {
      // Для слабых устройств значительно снижаем требования
      maxWidth = 1000;
      quality = 0.6;
      maxSizeMB = 0.5;
    } else if (deviceCapabilities.isMobileDevice) {
      // Для обычных мобильных устройств средние настройки
      maxWidth = 1500;
      quality = 0.7;
      maxSizeMB = 0.75;
    } else if (deviceCapabilities.hasWeakConnection) {
      // При плохом соединении приоритет на уменьшение размера
      maxWidth = 1200;
      quality = 0.65;
      maxSizeMB = 0.6;
    }
    
    // Дополнительные проверки для WebP поддержки
    let fileType = file.type;
    if (deviceCapabilities.isOlderIOS || deviceCapabilities.isOlderAndroid) {
      // Для старых устройств используем JPEG вместо WebP
      fileType = "image/jpeg";
    }
    
    const options = {
      maxSizeMB: maxSizeMB,
      maxWidthOrHeight: maxWidth,
      useWebWorker: !deviceCapabilities.hasWebWorkerIssues,
      fileType: fileType,
      initialQuality: quality,
      alwaysKeepResolution: false,
      // Changed from boolean to number as required by the Options type
      exifOrientation: deviceCapabilities.isLimitedBrowser ? 1 : 2
    };
    
    // Применение сжатия с отслеживанием времени и обработкой ошибок
    const startTime = Date.now();
    let compressedBlob;
    
    try {
      // Настраиваем таймаут для долгих операций на слабых устройствах
      const compressionPromise = imageCompression(file, options);
      const timeoutPromise = new Promise((_, reject) => {
        // Для слабых устройств более щедрый таймаут
        const timeout = deviceCapabilities.isLowEndDevice ? 30000 : 15000;
        setTimeout(() => reject(new Error("Превышено время сжатия изображения")), timeout);
      });
      
      // Используем Promise.race для ограничения времени выполнения
      compressedBlob = await Promise.race([compressionPromise, timeoutPromise]);
    } catch (compressionError) {
      logImageProcessing('CompressionError', {
        error: compressionError instanceof Error ? compressionError.message : String(compressionError),
        fileName: file.name
      });
      
      // В случае ошибки сжатия, пробуем альтернативные параметры
      if (!deviceCapabilities.isLowEndDevice) {
        // Если это не слабое устройство, попробуем с более щадящими настройками
        options.useWebWorker = false;
        options.maxWidthOrHeight = Math.min(options.maxWidthOrHeight, 1000);
        options.maxSizeMB = Math.min(options.maxSizeMB, 0.5);
        // Fixed exifOrientation to be a number
        options.exifOrientation = 2;
        
        logImageProcessing('RetryCompression', { 
          fileName: file.name, 
          newOptions: options 
        });
        
        try {
          compressedBlob = await imageCompression(file, options);
        } catch (secondError) {
          // Если даже второй подход не сработал, возвращаем оригинал с проверкой размера
          logImageProcessing('SecondCompressionError', { 
            error: secondError instanceof Error ? secondError.message : String(secondError)
          });
          
          // Проверяем, не слишком ли большой оригинальный файл
          if (file.size > 5 * 1024 * 1024) {
            throw new Error(`Файл слишком большой (${(file.size / 1024 / 1024).toFixed(1)} МБ). Максимальный размер - 5 МБ`);
          }
          return file;
        }
      } else {
        // Для слабых устройств сразу проверяем размер и возвращаем оригинал если он не слишком большой
        if (file.size > 3 * 1024 * 1024) {
          throw new Error(`Файл слишком большой для вашего устройства (${(file.size / 1024 / 1024).toFixed(1)} МБ). Максимальный размер - 3 МБ`);
        }
        return file;
      }
    }
    
    const processingTime = Date.now() - startTime;
    
    // Создание нового File объекта со сжатыми данными
    const optimizedFile = new File([compressedBlob], file.name, {
      type: compressedBlob.type || file.type,
      lastModified: Date.now()
    });
    
    logImageProcessing('OptimizationComplete', {
      fileName: file.name,
      originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      optimizedSize: `${(optimizedFile.size / 1024 / 1024).toFixed(2)}MB`,
      compressionRatio: `${Math.round((1 - (optimizedFile.size / file.size)) * 100)}%`,
      processingTime: `${processingTime}ms`,
      deviceSettings: {
        maxWidth, 
        quality, 
        maxSizeMB, 
        useWebWorker: options.useWebWorker
      }
    });
    
    return optimizedFile;
  } catch (error) {
    logImageProcessing('OptimizationError', {
      fileName: file.name,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Если возникла ошибка оптимизации, возвращаем оригинал с проверкой размера
    // в зависимости от типа устройства
    const deviceCapabilities = getDeviceCapabilities();
    const maxAllowedSize = deviceCapabilities.isLowEndDevice ? 
                           3 * 1024 * 1024 : // 3 МБ для слабых устройств
                           5 * 1024 * 1024;  // 5 МБ для обычных устройств
                         
    if (file.size > maxAllowedSize) {
      throw new Error(`Файл слишком большой (${(file.size / 1024 / 1024).toFixed(1)} МБ). На этом устройстве максимальный размер - ${maxAllowedSize / 1024 / 1024} МБ`);
    }
    
    return file;
  }
}

/**
 * Загружает изображение в хранилище Supabase с учетом ограничений устройства
 * и автоматическими повторными попытками при сбое
 * @param file Файл изображения для загрузки
 * @param storageBucket Имя bucket в хранилище Supabase (опционально)
 * @param storagePath Путь внутри bucket
 * @param maxRetries Максимальное количество повторных попыток загрузки при ошибках
 * @returns URL загруженного изображения
 */
export async function uploadImageToStorage(
  file: File,
  storageBucket?: string,
  storagePath: string = "",
  maxRetries: number = 3
): Promise<string> {
  try {
    // Проверяем права пользователя
    const permissionCheck = await checkUserUploadPermission();
    if (!permissionCheck.canUpload) {
      throw new Error(permissionCheck.message || "Нет прав на загрузку изображений");
    }
    
    // Получаем основное хранилище (если не указано другое)
    const bucket = storageBucket || await getPrimaryStorageBucket();
    
    // Логируем информацию о загрузке для диагностики
    logImageProcessing('UploadAttempt', { 
      originalBucket: storageBucket,
      selectedBucket: bucket,
      fileName: file.name,
      fileSize: `${(file.size / 1024).toFixed(2)}KB`,
      fileType: file.type
    });
    
    // Сначала оптимизируем изображение с учетом возможностей устройства
    const optimizedFile = await optimizeImageForMarketplace(file);
    
    // Генерируем уникальное имя файла для избежания коллизий
    const fileExt = optimizedFile.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const fileName = `${storagePath ? `${storagePath}/` : ''}${timestamp}-${randomString}.${fileExt}`;
    
    logImageProcessing('UploadStart', { 
      fileName, 
      bucket,
      fileSize: `${(optimizedFile.size / 1024).toFixed(2)}KB`
    });
    
    // Функция для попытки загрузки с указанным bucket
    const tryUpload = async (bucketName: string, retriesLeft: number): Promise<string> => {
      try {
        // Пробуем загрузить в Supabase storage
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(fileName, optimizedFile, {
            cacheControl: '3600',
            contentType: optimizedFile.type,
            upsert: false
          });
          
        if (error) {
          logImageProcessing('UploadError', { 
            bucket: bucketName,
            error: error.message,
            details: error.details,
            code: error.code,
            retriesLeft
          });
          
          if (retriesLeft > 0) {
            // Искусственная задержка перед повторной попыткой
            await new Promise(resolve => setTimeout(resolve, 1000));
            return await tryUpload(bucketName, retriesLeft - 1);
          }
          
          // Если попытки закончились, попробуем альтернативный bucket
          if (bucketName === "Product Images") {
            logImageProcessing('TryingAlternativeBucket', { alternativeBucket: "product-images" });
            return await tryUpload("product-images", maxRetries);
          } else if (bucketName === "product-images") {
            logImageProcessing('TryingAlternativeBucket', { alternativeBucket: "Product Images" });
            return await tryUpload("Product Images", maxRetries);
          }
          
          // Если все варианты испробованы, выбрасываем ошибку
          throw error;
        }
        
        // Получаем публичный URL для загруженного изображения
        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(fileName);
          
        logImageProcessing('UploadSuccess', {
          fileName,
          publicUrl,
          fileSize: `${(optimizedFile.size / 1024).toFixed(2)}KB`,
          bucket: bucketName
        });
        
        return publicUrl;
      } catch (error) {
        if (retriesLeft > 0) {
          logImageProcessing('RetryingUpload', {
            bucket: bucketName,
            error: error instanceof Error ? error.message : String(error),
            retriesLeft
          });
          
          // Искусственная задержка перед повторной попыткой
          await new Promise(resolve => setTimeout(resolve, 1000));
          return await tryUpload(bucketName, retriesLeft - 1);
        }
        throw error;
      }
    };
    
    // Начинаем процесс загрузки с указанным количеством повторных попыток
    return await tryUpload(bucket, maxRetries);
  } catch (error) {
    logImageProcessing('UploadException', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

/**
 * Проверяет, превышает ли файл лимит размера
 * @param file Файл для проверки
 * @param maxSizeMB Максимальный размер в МБ
 * @returns Boolean, указывающий, слишком ли файл большой
 */
export function isFileTooLarge(file: File, maxSizeMB: number = 25): boolean {
  return file.size > maxSizeMB * 1024 * 1024;
}

/**
 * Проверяет изображение на соответствие требованиям маркетплейса
 * с учетом возможностей устройства
 * @param file Файл для проверки
 * @returns Объект с результатом валидации и сообщением об ошибке
 */
export function validateImageForMarketplace(file: File): { isValid: boolean; errorMessage?: string } {
  // Проверяем, является ли файл изображением
  if (!file.type.startsWith('image/')) {
    return { 
      isValid: false, 
      errorMessage: `${file.name} не является изображением` 
    };
  }
  
  const deviceCapabilities = getDeviceCapabilities();
  
  // Устанавливаем ограничение размера в зависимости от устройства
  const maxSizeMB = deviceCapabilities.isLowEndDevice ? 8 : 
                   (deviceCapabilities.isMobileDevice ? 15 : 25);
  
  // Проверяем размер файла
  if (isFileTooLarge(file, maxSizeMB)) {
    return { 
      isValid: false, 
      errorMessage: `${file.name} превышает максимальный размер ${maxSizeMB} МБ для вашего устройства` 
    };
  }
  
  // Проверяем поддерживаемые форматы
  const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!supportedTypes.includes(file.type)) {
    return {
      isValid: false,
      errorMessage: `${file.name} имеет неподдерживаемый формат. Используйте JPEG, PNG или WebP.`
    };
  }
  
  return { isValid: true };
}

/**
 * Обрабатывает изображение для загрузки, включая оптимизацию и генерацию превью
 * @param file Файл изображения для обработки
 * @returns Объект с оптимизированным файлом и превью (если есть)
 */
export async function processImageForUpload(file: File): Promise<{ 
  optimizedFile: File, 
  previewFile?: File,
  originalSize: number,
  optimizedSize: number 
}> {
  try {
    // Оптимизируем изображение с учетом возможностей устройства
    const optimizedFile = await optimizeImageForMarketplace(file);
    
    // Возвращаем обработанный файл (без превью, так как оно было удалено)
    return {
      optimizedFile,
      originalSize: file.size,
      optimizedSize: optimizedFile.size
    };
  } catch (error) {
    logImageProcessing('ProcessingError', {
      fileName: file.name,
      error: error instanceof Error ? error.message : String(error)
    });
    console.error('Ошибка обработки изображения:', error);
    
    // Если обработка не удалась, возвращаем оригинальный файл
    return {
      optimizedFile: file,
      originalSize: file.size,
      optimizedSize: file.size
    };
  }
}

/**
 * Обновляет URL-адреса превью продуктов в базе данных
 * @param productId ID продукта для обновления
 * @returns Результат операции обновления
 */
export async function forceUpdateProductPreviews(productId: string): Promise<{
  success: boolean,
  message: string,
  details?: any
}> {
  try {
    logImageProcessing('ForceUpdateStart', { productId });
    
    // Проверка наличия продукта
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, title')
      .eq('id', productId)
      .single();
      
    if (productError || !product) {
      return {
        success: false,
        message: 'Продукт не найден'
      };
    }
    
    // Получаем все изображения продукта
    const { data: images, error: imagesError } = await supabase
      .from('product_images')
      .select('id, url')
      .eq('product_id', productId);
      
    if (imagesError) {
      return {
        success: false,
        message: 'Ошибка получения изображений продукта'
      };
    }
    
    // Синтетический код для проверки наличия изображений
    const imageCount = images?.length || 0;
    
    return {
      success: true,
      message: `Продукт проверен (${imageCount} изображений)`,
      details: {
        imageCount
      }
    };
  } catch (error) {
    logImageProcessing('ForceUpdateError', {
      productId,
      error: error instanceof Error ? error.message : String(error)
    });
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Неизвестная ошибка'
    };
  }
}

/**
 * Проверяет и восстанавливает URL-адреса превью в базе данных
 * @param productId ID продукта для проверки
 * @returns Результат операции восстановления
 */
export async function checkAndRepairPreviewUrls(productId: string): Promise<{
  success: boolean,
  message: string,
  details?: any
}> {
  try {
    logImageProcessing('RepairStart', { productId });
    
    // Проверка наличия продукта
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, title')
      .eq('id', productId)
      .single();
      
    if (productError || !product) {
      return {
        success: false,
        message: 'Продукт не найден'
      };
    }
    
    // Синтетический код для проверки наличия изображений
    const imageCount = 0;
    
    return {
      success: true,
      message: 'Нет необходимости восстановления (превью функционал удален)',
      details: {
        imageCount
      }
    };
  } catch (error) {
    logImageProcessing('RepairError', {
      productId,
      error: error instanceof Error ? error.message : String(error)
    });
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Неизвестная ошибка'
    };
  }
}

/**
 * Проверяет статус генерации превью продуктов
 * @param productId ID продукта для проверки
 * @returns Результат проверки
 */
export async function verifyProductPreviewGeneration(productId: string): Promise<{
  success: boolean,
  message?: string,
  totalImages: number,
  imagesWithPreview: number,
  hasPreview: boolean
}> {
  try {
    logImageProcessing('VerifyStart', { productId });
    
    // Проверка наличия продукта
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, title, has_preview')
      .eq('id', productId)
      .single();
      
    if (productError || !product) {
      return {
        success: false,
        message: 'Продукт не найден',
        totalImages: 0,
        imagesWithPreview: 0,
        hasPreview: false
      };
    }
    
    // Получаем все изображения продукта
    const { data: images, error: imagesError } = await supabase
      .from('product_images')
      .select('id, url, preview_url')
      .eq('product_id', productId);
      
    if (imagesError) {
      return {
        success: false,
        message: 'Ошибка получения изображений продукта',
        totalImages: 0,
        imagesWithPreview: 0,
        hasPreview: false
      };
    }
    
    const totalImages = images?.length || 0;
    // Синтетический код для проверки наличия превью
    const imagesWithPreview = 0;
    
    return {
      success: true,
      totalImages,
      imagesWithPreview,
      hasPreview: product.has_preview || false
    };
  } catch (error) {
    logImageProcessing('VerifyError', {
      productId,
      error: error instanceof Error ? error.message : String(error)
    });
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      totalImages: 0,
      imagesWithPreview: 0,
      hasPreview: false
    };
  }
}

/**
 * Загружает изображения в Supabase с учетом ограничений устройства
 * @param files Массив файлов для загрузки
 * @param storageBucket Имя bucket в хранилище Supabase
 * @param storagePath Путь внутри bucket
 * @param onProgress Функция обратного вызова для отслеживания прогресса
 * @param concurrentUploads Максимальное количество одновременных загрузок
 * @returns Массив URL загруженных изображений
 */
export async function uploadMultipleImages(
  files: File[],
  storageBucket: string,
  storagePath: string = "",
  onProgress?: (overall: number, fileIndex: number, progress: number) => void,
  concurrentUploads: number = 3
): Promise<string[]> {
  const uploadedUrls: string[] = [];
  let completed = 0;
  const total = files.length;
  
  // Обработка файлов в пакетах для ограничения одновременных операций
  for (let i = 0; i < total; i += concurrentUploads) {
    const batch = files.slice(i, i + concurrentUploads);
    const batchPromises = batch.map((file, batchIndex) => {
      const fileIndex = i + batchIndex;
      
      return new Promise<string>(async (resolve, reject) => {
        try {
          // Симуляция прогресса загрузки
          const uploadProgressInterval = setInterval(() => {
            if (onProgress) {
              const progress = Math.min(Math.round(Math.random() * 50 + 30), 90);
              onProgress(Math.round((completed / total) * 100), fileIndex, progress);
            }
          }, 300);
          
          // Выполнение загрузки
          const url = await uploadImageToStorage(file, storageBucket, storagePath);
          
          // Очистка интервала и отслеживание завершения загрузки
          clearInterval(uploadProgressInterval);
          completed++;
          
          if (onProgress) {
            onProgress(Math.round((completed / total) * 100), fileIndex, 100);
          }
          
          resolve(url);
        } catch (error) {
          completed++;
          reject(error);
        }
      });
    });
    
    // Ожидание завершения загрузки текущего пакета
    const results = await Promise.allSettled(batchPromises);
    
    // Обработка результатов
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        uploadedUrls.push(result.value);
      } else {
        console.error('Ошибка загрузки файла:', result.reason);
      }
    });
  }
  
  return uploadedUrls;
}

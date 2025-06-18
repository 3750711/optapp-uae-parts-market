
// Константы для умного сжатия
export const COMPRESSION_THRESHOLDS = {
  NO_COMPRESSION: 400 * 1024,     // 400KB - не сжимаем
  LIGHT_COMPRESSION: 2 * 1024 * 1024,  // 2MB - легкое сжатие
  HEAVY_COMPRESSION: 10 * 1024 * 1024  // 10MB - агрессивное сжатие
};

export interface SmartCompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  initialQuality: number;
  fileType: string;
}

/**
 * Определяет параметры сжатия в зависимости от размера файла
 * @param fileSize Размер файла в байтах
 * @returns Настройки сжатия или null если сжатие не нужно
 */
export const getSmartCompressionSettings = (fileSize: number): SmartCompressionOptions | null => {
  // Файлы меньше 400KB не сжимаем - сохраняем оригинальное качество
  if (fileSize < COMPRESSION_THRESHOLDS.NO_COMPRESSION) {
    console.log(`🎯 No compression needed for file ${Math.round(fileSize / 1024)}KB (< 400KB threshold)`);
    return null;
  }
  
  // Файлы 400KB-2MB - легкое сжатие, высокое качество
  if (fileSize < COMPRESSION_THRESHOLDS.LIGHT_COMPRESSION) {
    console.log(`🟢 Light compression for file ${Math.round(fileSize / 1024)}KB (400KB-2MB range)`);
    return {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 1920,
      initialQuality: 0.9,
      fileType: 'image/webp'
    };
  }
  
  // Файлы 2MB-10MB - среднее сжатие
  if (fileSize < COMPRESSION_THRESHOLDS.HEAVY_COMPRESSION) {
    console.log(`🟡 Medium compression for file ${Math.round(fileSize / 1024)}KB (2MB-10MB range)`);
    return {
      maxSizeMB: 1,
      maxWidthOrHeight: 1600,
      initialQuality: 0.8,
      fileType: 'image/webp'
    };
  }
  
  // Файлы больше 10MB - агрессивное сжатие
  console.log(`🔴 Heavy compression for file ${Math.round(fileSize / 1024)}KB (>10MB)`);
  return {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1200,
    initialQuality: 0.6,
    fileType: 'image/webp'
  };
};

/**
 * Проверяет, нужно ли сжимать файл
 * @param fileSize Размер файла в байтах
 * @returns true если файл нужно сжимать
 */
export const shouldCompressFile = (fileSize: number): boolean => {
  return fileSize >= COMPRESSION_THRESHOLDS.NO_COMPRESSION;
};

/**
 * Форматирует размер файла для отображения
 * @param bytes Размер в байтах
 * @returns Отформатированная строка
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * Вычисляет процент сжатия
 * @param originalSize Исходный размер
 * @param compressedSize Сжатый размер
 * @returns Процент сжатия
 */
export const getCompressionRatio = (originalSize: number, compressedSize: number): number => {
  if (originalSize === 0) return 0;
  return Math.round((1 - compressedSize / originalSize) * 100);
};

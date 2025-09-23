
import { logger } from '@/utils/logger';

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
 * @param fileName Имя файла для определения типа
 * @returns Настройки сжатия или null если сжатие не нужно
 */
export const getSmartCompressionSettings = (fileSize: number, fileName?: string): SmartCompressionOptions | null => {
  // Check if it's a HEIC file
  const isHeicFile = fileName && 
    (fileName.toLowerCase().endsWith('.heic') || fileName.toLowerCase().endsWith('.heif'));
  
  // HEIC files should be handled by Cloudinary conversion, not compressed locally
  if (isHeicFile) {
    logger.log(`🔄 HEIC file detected: ${fileName} - will be converted by Cloudinary`);
    return null; // Skip local compression for HEIC files
  }
  
  // Файлы меньше 400KB не сжимаем - сохраняем оригинальное качество
  if (fileSize < COMPRESSION_THRESHOLDS.NO_COMPRESSION) {
    logger.log(`🎯 No compression needed for file ${Math.round(fileSize / 1024)}KB (< 400KB threshold)`);
    return null;
  }
  
  // Файлы 400KB-2MB - легкое сжатие, высокое качество
  if (fileSize < COMPRESSION_THRESHOLDS.LIGHT_COMPRESSION) {
    logger.log(`🟢 Light compression for file ${Math.round(fileSize / 1024)}KB (400KB-2MB range)`);
    return {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 1920,
      initialQuality: 0.9,
      fileType: 'image/webp'
    };
  }
  
  // Файлы 2MB-10MB - среднее сжатие
  if (fileSize < COMPRESSION_THRESHOLDS.HEAVY_COMPRESSION) {
    logger.log(`🟡 Medium compression for file ${Math.round(fileSize / 1024)}KB (2MB-10MB range)`);
    return {
      maxSizeMB: 1,
      maxWidthOrHeight: 1600,
      initialQuality: 0.8,
      fileType: 'image/webp'
    };
  }
  
  // Файлы больше 10MB - агрессивное сжатие
  logger.log(`🔴 Heavy compression for file ${Math.round(fileSize / 1024)}KB (>10MB)`);
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
 * @param fileName Имя файла для определения типа
 * @returns true если файл нужно сжимать
 */
export const shouldCompressFile = (fileSize: number, fileName?: string): boolean => {
  // Don't compress HEIC files locally - let Cloudinary handle them
  const isHeicFile = fileName && 
    (fileName.toLowerCase().endsWith('.heic') || fileName.toLowerCase().endsWith('.heif'));
  
  if (isHeicFile) {
    return false;
  }
  
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

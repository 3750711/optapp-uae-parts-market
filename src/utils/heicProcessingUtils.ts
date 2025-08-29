// HEIC processing utility functions

export const isHeicFile = (file: File): boolean => {
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  
  return type.includes('heic') || 
         type.includes('heif') || 
         name.endsWith('.heic') || 
         name.endsWith('.heif');
};

export const logHeicProcessing = (stage: 'detected' | 'converting' | 'success' | 'error', file?: File, result?: any) => {
  const timestamp = new Date().toISOString();
  
  switch (stage) {
    case 'detected':
      console.log(`🔄 HEIC Processing [${timestamp}]: Файл HEIC обнаружен`, {
        fileName: file?.name,
        fileSize: file?.size ? `${Math.round(file.size / 1024)}KB` : 'unknown',
        fileType: file?.type,
        status: 'Начинается конвертация в JPEG...'
      });
      break;
      
    case 'converting':
      console.log(`⚙️ HEIC Processing [${timestamp}]: Конвертация в процессе...`, {
        fileName: file?.name,
        status: 'Используется WASM библиотека для конвертации'
      });
      break;
      
    case 'success':
      console.log(`✅ HEIC Processing [${timestamp}]: Успешная конвертация HEIC → JPEG`, {
        fileName: file?.name,
        originalSize: file?.size ? `${Math.round(file.size / 1024)}KB` : 'unknown',
        convertedSize: result?.blob?.size ? `${Math.round(result.blob.size / 1024)}KB` : 'unknown',
        dimensions: result?.width && result?.height ? `${result.width}x${result.height}` : 'unknown',
        compressionRatio: file?.size && result?.blob?.size 
          ? `${Math.round((1 - result.blob.size / file.size) * 100)}% сжатие` 
          : 'unknown'
      });
      break;
      
    case 'error':
      console.error(`❌ HEIC Processing [${timestamp}]: Ошибка конвертации`, {
        fileName: file?.name,
        error: result?.message || 'Неизвестная ошибка',
        fallback: 'Файл будет загружен как есть'
      });
      break;
  }
};

export const getHeicStatusMessage = (status: string, fileName?: string): string => {
  switch (status) {
    case 'compressing':
      return fileName?.toLowerCase().match(/\.(heic|heif)$/i) 
        ? 'Конвертация HEIC → JPEG...' 
        : 'Компрессия...';
    case 'uploading':
      return 'Загрузка JPEG...';
    case 'success':
      return 'JPEG готов ✅';
    case 'error':
      return 'Ошибка конвертации ❌';
    default:
      return 'Обработка...';
  }
};
/**
 * File validation utilities with magic bytes checking
 * Prevents malicious file uploads by verifying actual file signatures
 */

interface FileSignature {
  signature: string;
  mimeType: string;
  extensions: string[];
}

// Known file signatures (magic bytes) for safe image formats
const SAFE_IMAGE_SIGNATURES: FileSignature[] = [
  { signature: 'FFD8FF', mimeType: 'image/jpeg', extensions: ['jpg', 'jpeg'] },
  { signature: '89504E47', mimeType: 'image/png', extensions: ['png'] },
  { signature: '52494646', mimeType: 'image/webp', extensions: ['webp'] },
  { signature: '47494638', mimeType: 'image/gif', extensions: ['gif'] },
  { signature: '49492A00', mimeType: 'image/tiff', extensions: ['tiff', 'tif'] },
  { signature: '4D4D002A', mimeType: 'image/tiff', extensions: ['tiff', 'tif'] },
  // HEIC files have different signatures
  { signature: '66747970', mimeType: 'image/heic', extensions: ['heic', 'heif'] },
];

// Known video signatures
const SAFE_VIDEO_SIGNATURES: FileSignature[] = [
  { signature: '000000', mimeType: 'video/mp4', extensions: ['mp4'] },
  { signature: '1A45DFA3', mimeType: 'video/webm', extensions: ['webm'] },
  { signature: '464C5601', mimeType: 'video/x-flv', extensions: ['flv'] },
];

/**
 * Validates file by checking its magic bytes against known safe signatures
 */
export const validateFileSignature = async (file: File): Promise<{
  isValid: boolean;
  detectedType?: string;
  error?: string;
}> => {
  try {
    // Read first 12 bytes to check magic signature
    const arrayBuffer = await file.slice(0, 12).arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const hexSignature = Array.from(uint8Array)
      .map(byte => byte.toString(16).padStart(2, '0').toUpperCase())
      .join('');

    console.log(`🔍 File signature check: ${file.name}, hex: ${hexSignature.substring(0, 16)}`);

    // Check against known safe signatures
    for (const sig of SAFE_IMAGE_SIGNATURES) {
      if (hexSignature.startsWith(sig.signature)) {
        console.log(`✅ Valid image detected: ${sig.mimeType}`);
        return {
          isValid: true,
          detectedType: sig.mimeType
        };
      }
    }

    for (const sig of SAFE_VIDEO_SIGNATURES) {
      if (hexSignature.startsWith(sig.signature)) {
        console.log(`✅ Valid video detected: ${sig.mimeType}`);
        return {
          isValid: true,
          detectedType: sig.mimeType
        };
      }
    }

    // Special case for HEIC files (more complex signature)
    if (hexSignature.includes('6674797068656963') || // ftyp + heic
        hexSignature.includes('667479706D696631') || // ftyp + mif1
        hexSignature.includes('667479706865696D')) {   // ftyp + heim
      console.log('✅ Valid HEIC image detected');
      return {
        isValid: true,
        detectedType: 'image/heic'
      };
    }

    console.warn(`❌ Unknown or unsafe file signature: ${file.name}`);
    return {
      isValid: false,
      error: `Unsafe file format detected. Only images and videos are allowed.`
    };

  } catch (error) {
    console.error('Error validating file signature:', error);
    return {
      isValid: false,
      error: 'Failed to validate file format'
    };
  }
};

/**
 * Validates file size limits
 */
export const validateFileSize = (file: File, maxSizeMB: number = 20): {
  isValid: boolean;
  error?: string;
} => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `File too large. Maximum size is ${maxSizeMB}MB`
    };
  }

  return { isValid: true };
};

/**
 * Comprehensive file validation
 */
export const validateUploadFile = async (file: File): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file size
  const sizeValidation = validateFileSize(file);
  if (!sizeValidation.isValid) {
    errors.push(sizeValidation.error!);
  }

  // Check magic bytes
  const signatureValidation = await validateFileSignature(file);
  if (!signatureValidation.isValid) {
    errors.push(signatureValidation.error!);
  }

  // Check MIME type vs actual content
  if (signatureValidation.detectedType && 
      signatureValidation.detectedType !== file.type) {
    warnings.push(`File extension mismatch: claimed ${file.type}, detected ${signatureValidation.detectedType}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Legacy functions for backward compatibility
export const isAllowedImage = (file: File): boolean => {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 
    'image/gif', 'image/heic', 'image/heif'
  ];
  return allowedTypes.includes(file.type.toLowerCase());
};

export const isAllowedVideo = (file: File): boolean => {
  const allowedTypes = [
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'
  ];
  return allowedTypes.includes(file.type.toLowerCase());
};

export const getFileValidationError = (file: File, expectedType?: 'image' | 'video'): string | null => {
  if (expectedType === 'image' && !isAllowedImage(file)) {
    return 'Unsupported image format';
  }
  
  if (expectedType === 'video' && !isAllowedVideo(file)) {
    return 'Unsupported video format';
  }
  
  if (!expectedType && !isAllowedImage(file) && !isAllowedVideo(file)) {
    return 'Unsupported file format';
  }
  
  const maxSize = 20 * 1024 * 1024; // 20MB
  if (file.size > maxSize) {
    return 'File too large (max 20MB)';
  }
  
  return null;
};

export const getImageAcceptAttribute = (): string => {
  return 'image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic,image/heif';
};

export const getVideoAcceptAttribute = (): string => {
  return 'video/mp4,video/webm,video/quicktime,video/x-msvideo';
};
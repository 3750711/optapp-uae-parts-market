/**
 * EXIF orientation handling for image previews
 */
export const getImageOrientation = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    // Защитная проверка File объекта
    if (!file || typeof file !== 'object') {
      console.warn('EXIF: Invalid file object provided, using default orientation');
      resolve(1);
      return;
    }

    // Проверяем что это действительно File или Blob объект с методом slice
    if (!('slice' in file) || typeof (file as any).slice !== 'function') {
      console.warn('EXIF: File object missing slice method, using default orientation');
      resolve(1);
      return;
    }

    try {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const dataView = new DataView(arrayBuffer);
          
          // Check for EXIF marker
          if (dataView.getUint16(0) !== 0xFFD8) {
            resolve(1); // No EXIF, assume normal orientation
            return;
          }
          
          let offset = 2;
          let marker;
          
          while (offset < dataView.byteLength) {
            marker = dataView.getUint16(offset);
            offset += 2;
            
            if (marker === 0xFFE1) { // EXIF marker
              offset += 2; // Skip length
              
              if (dataView.getUint32(offset) === 0x45786966) { // "Exif"
                const orientation = extractOrientation(dataView, offset + 6);
                resolve(orientation);
                return;
              }
            } else {
              offset += dataView.getUint16(offset);
            }
          }
          
          resolve(1); // Default orientation
        } catch (error) {
          console.warn('EXIF: Error processing file data, using default orientation:', error);
          resolve(1);
        }
      };
      
      reader.onerror = () => {
        console.warn('EXIF: FileReader error, using default orientation');
        resolve(1);
      };
      
      reader.readAsArrayBuffer(file.slice(0, 65536)); // Read first 64KB
    } catch (error) {
      console.warn('EXIF: Error setting up file reader, using default orientation:', error);
      resolve(1);
    }
  });
};

const extractOrientation = (dataView: DataView, offset: number): number => {
  // Simplified EXIF orientation extraction
  try {
    const isLittleEndian = dataView.getUint16(offset) === 0x4949;
    offset += dataView.getUint32(offset + 4, isLittleEndian);
    
    const tags = dataView.getUint16(offset, isLittleEndian);
    offset += 2;
    
    for (let i = 0; i < tags; i++) {
      const tag = dataView.getUint16(offset + i * 12, isLittleEndian);
      if (tag === 0x0112) { // Orientation tag
        return dataView.getUint16(offset + i * 12 + 8, isLittleEndian);
      }
    }
  } catch (e) {
    console.warn('EXIF parsing error:', e);
  }
  
  return 1;
};

export const getOrientationCSS = (orientation: number): string => {
  const transforms = {
    2: 'scaleX(-1)',
    3: 'rotate(180deg)',
    4: 'scaleY(-1)',
    5: 'scaleX(-1) rotate(90deg)',
    6: 'rotate(90deg)',
    7: 'scaleX(-1) rotate(-90deg)',
    8: 'rotate(-90deg)'
  };
  
  return transforms[orientation as keyof typeof transforms] || 'none';
};
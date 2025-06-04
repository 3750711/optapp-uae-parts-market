
import { supabase } from "@/integrations/supabase/client";

export const uploadImageToStorage = async (
  file: File,
  bucket: string = 'product-images',
  path: string = ''
): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = path ? `${path}/${fileName}` : fileName;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrl;
};

export const validateImageForMarketplace = (file: File) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      errorMessage: 'Неподдерживаемый тип файла. Используйте JPEG, PNG или WebP.'
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      errorMessage: 'Файл слишком большой. Максимальный размер: 10MB.'
    };
  }

  return { isValid: true };
};

export const logImageProcessing = (eventType: string, data: any) => {
  console.log(`[${eventType}]`, data);
};


import { supabase } from "@/integrations/supabase/client";

// Функция для проверки доступности Edge Functions
export const checkEdgeFunctionAvailability = async () => {
  console.log('🔍 Checking Edge Function availability...');
  
  try {
    // Проверяем доступность cloudinary-upload функции
    const testFormData = new FormData();
    testFormData.append('test', 'true');
    
    const { data, error } = await supabase.functions.invoke('cloudinary-upload', {
      body: testFormData
    });
    
    console.log('✅ Edge Function test result:', { data, error });
    
    if (error) {
      console.error('❌ Edge Function not accessible:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('💥 Edge Function test failed:', error);
    return false;
  }
};

// Функция для проверки переменных окружения через Edge Function
export const checkCloudinaryConfig = async () => {
  console.log('🔧 Checking Cloudinary configuration...');
  
  try {
    const { data, error } = await supabase.functions.invoke('cloudinary-upload', {
      body: { test: 'config' }
    });
    
    console.log('🔧 Config check result:', { data, error });
    
    // Если получили ошибку о конфигурации, это хороший знак - функция работает
    if (error?.message?.includes('credentials') || error?.message?.includes('configuration')) {
      console.log('✅ Edge Function accessible, but config issue detected');
      return 'config_issue';
    }
    
    if (error) {
      console.error('❌ Edge Function config check failed:', error);
      return 'function_issue';
    }
    
    return 'ok';
  } catch (error) {
    console.error('💥 Config check failed:', error);
    return 'error';
  }
};

// Функция для детальной диагностики загрузки
export const diagnoseUploadIssue = async (file: File) => {
  console.log('🔬 Starting upload diagnosis for file:', file.name);
  
  const diagnosis = {
    fileValid: false,
    edgeFunctionAccessible: false,
    cloudinaryConfigured: false,
    uploadError: null as any
  };
  
  // 1. Проверяем файл
  console.log('📁 Checking file validity...');
  diagnosis.fileValid = file.size > 0 && file.type.startsWith('image/');
  console.log('📁 File valid:', diagnosis.fileValid);
  
  // 2. Проверяем доступность Edge Function
  console.log('🔌 Checking Edge Function accessibility...');
  diagnosis.edgeFunctionAccessible = await checkEdgeFunctionAvailability();
  console.log('🔌 Edge Function accessible:', diagnosis.edgeFunctionAccessible);
  
  // 3. Проверяем конфигурацию Cloudinary
  console.log('☁️ Checking Cloudinary configuration...');
  const configStatus = await checkCloudinaryConfig();
  diagnosis.cloudinaryConfigured = configStatus === 'ok';
  console.log('☁️ Cloudinary configured:', diagnosis.cloudinaryConfigured, 'Status:', configStatus);
  
  // 4. Пробуем загрузить файл
  if (diagnosis.fileValid && diagnosis.edgeFunctionAccessible) {
    console.log('🧪 Attempting test upload...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const { data, error } = await supabase.functions.invoke('cloudinary-upload', {
        body: formData
      });
      
      if (error) {
        diagnosis.uploadError = error;
        console.error('❌ Test upload failed:', error);
      } else {
        console.log('✅ Test upload successful:', data);
      }
    } catch (error) {
      diagnosis.uploadError = error;
      console.error('💥 Test upload exception:', error);
    }
  }
  
  console.log('🔬 Diagnosis completed:', diagnosis);
  return diagnosis;
};

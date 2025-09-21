import { supabase } from "@/integrations/supabase/client";

/**
 * Тестовая функция для проверки системы позиционирования каталога
 * Проверяет создание товара, репосты и сортировку
 */
export const testCatalogPositioning = async () => {
  console.log('🧪 Начинаем тестирование системы позиционирования каталога...');
  
  try {
    // Получаем текущего пользователя
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ Пользователь не авторизован');
      return;
    }

    // 1. Создать тестовый товар
    console.log('📦 Создаем тестовый товар...');
    const { data: testProduct, error: createError } = await supabase
      .from('products')
      .insert({
        title: `Test Product ${Date.now()}`,
        brand: 'Test Brand',
        condition: 'new',
        price: 100,
        seller_id: user.id,
        seller_name: 'Test Seller',
        status: 'active'
      })
      .select()
      .single();
    
    if (createError || !testProduct) {
      console.error('❌ Ошибка создания товара:', createError);
      return;
    }

    console.log('✅ Создан тестовый товар:', testProduct.id);
    console.log('📅 catalog_position:', testProduct.catalog_position);
    console.log('📅 created_at:', testProduct.created_at);
    
    // 2. Проверить что catalog_position = created_at
    const isEqual = new Date(testProduct.catalog_position).getTime() === new Date(testProduct.created_at).getTime();
    console.log('🔍 Position equals created_at:', isEqual ? '✅ YES' : '❌ NO');
    
    // 3. Подождать секунду и сделать репост (обновить позицию)
    console.log('⏱️ Ждем 1 секунду перед репостом...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const repostTime = new Date().toISOString();
    console.log('🔄 Делаем репост товара...');
    
    const { data: repostedProduct, error: repostError } = await supabase
      .from('products')
      .update({ catalog_position: repostTime })
      .eq('id', testProduct.id)
      .select()
      .single();
      
    if (repostError || !repostedProduct) {
      console.error('❌ Ошибка репоста:', repostError);
    } else {
      console.log('✅ Репост выполнен');
      console.log('📅 Новый catalog_position:', repostedProduct.catalog_position);
      
      // Проверяем что позиция изменилась
      const positionChanged = repostedProduct.catalog_position !== testProduct.catalog_position;
      console.log('🔍 Position changed:', positionChanged ? '✅ YES' : '❌ NO');
    }
    
    // 4. Проверить сортировку в каталоге
    console.log('📊 Проверяем сортировку в каталоге...');
    const { data: sortedProducts, error: sortError } = await supabase
      .from('products')
      .select('id, title, catalog_position, created_at')
      .eq('status', 'active')
      .order('catalog_position', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (sortError) {
      console.error('❌ Ошибка получения отсортированных товаров:', sortError);
    } else {
      console.log('📋 Топ-5 товаров по позиции:');
      sortedProducts?.forEach((product, index) => {
        const isTestProduct = product.id === testProduct.id;
        console.log(`${index + 1}. ${product.title} ${isTestProduct ? '🎯 (TEST)' : ''}`);
        console.log(`   Position: ${product.catalog_position}`);
      });
      
      // Проверяем что наш товар в топе (первый или второй)
      const testProductPosition = sortedProducts?.findIndex(p => p.id === testProduct.id);
      if (testProductPosition !== undefined && testProductPosition < 2) {
        console.log('✅ Тестовый товар находится в топе каталога');
      } else {
        console.log('❌ Тестовый товар НЕ в топе каталога');
      }
    }
    
    // 5. Удалить тестовый товар
    console.log('🗑️ Удаляем тестовый товар...');
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', testProduct.id);
      
    if (deleteError) {
      console.error('❌ Ошибка удаления тестового товара:', deleteError);
    } else {
      console.log('✅ Тестовый товар удален');
    }
    
    console.log('🎉 Тестирование завершено!');
    
  } catch (error) {
    console.error('💥 Ошибка во время тестирования:', error);
  }
};

/**
 * Функция для быстрой проверки валидности системы позиционирования
 */
export const validateCatalogSystem = async () => {
  console.log('🔍 Быстрая валидация системы позиционирования...');
  
  try {
    // Проверяем есть ли товары без catalog_position
    const { data: productsWithoutPosition, error } = await supabase
      .from('products')
      .select('id, title, catalog_position, created_at')
      .is('catalog_position', null)
      .limit(10);
      
    if (error) {
      console.error('❌ Ошибка проверки товаров:', error);
      return;
    }
    
    if (productsWithoutPosition && productsWithoutPosition.length > 0) {
      console.log(`⚠️ Найдено ${productsWithoutPosition.length} товаров без catalog_position:`);
      productsWithoutPosition.forEach(product => {
        console.log(`- ${product.title} (ID: ${product.id})`);
      });
    } else {
      console.log('✅ Все товары имеют catalog_position');
    }
    
    // Проверяем сортировку
    const { data: topProducts } = await supabase
      .from('products')
      .select('title, catalog_position, created_at')
      .eq('status', 'active')
      .order('catalog_position', { ascending: false })
      .limit(3);
      
    if (topProducts && topProducts.length > 0) {
      console.log('📊 Топ-3 товара по позиции:');
      topProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.title}`);
        console.log(`   Position: ${product.catalog_position}`);
      });
    }
    
  } catch (error) {
    console.error('💥 Ошибка валидации:', error);
  }
};
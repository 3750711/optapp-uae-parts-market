// Тест для проверки устранения client_error на ActivityMonitor
(async () => {
  console.log('🔍 Проверка устранения client_error на ActivityMonitor\n');
  
  // 1. Очистка консоли для чистого теста
  console.clear();
  
  // 2. Подключение к отслеживанию событий 
  let errorCount = 0;
  let originalError = console.error;
  
  console.error = function(...args) {
    errorCount++;
    console.log(`❌ Client Error #${errorCount}:`, ...args);
    originalError.apply(console, args);
  };
  
  // 3. Проверка текущей страницы
  const currentPath = window.location.pathname;
  console.log(`📍 Текущая страница: ${currentPath}`);
  
  // 4. Если мы на ActivityMonitor, проверяем Select элементы
  if (currentPath.includes('activity-monitor')) {
    console.log('✅ Находимся на странице ActivityMonitor');
    
    // Проверка наличия Select элементов
    const selectTriggers = document.querySelectorAll('[data-radix-select-trigger]');
    console.log(`🔧 Найдено Select элементов: ${selectTriggers.length}`);
    
    // Симуляция открытия Select для проверки
    setTimeout(() => {
      selectTriggers.forEach((trigger, index) => {
        console.log(`🧪 Тестирую Select #${index + 1}`);
        trigger.click();
        
        setTimeout(() => {
          // Закрываем Select
          document.addEventListener('click', (e) => {
            if (!trigger.contains(e.target)) {
              trigger.click();
            }
          }, { once: true });
          
          // Кликаем вне Select для закрытия
          document.body.click();
        }, 100);
      });
      
      // Итоговая проверка через 2 секунды
      setTimeout(() => {
        console.log(`\n📊 Итоговый результат:`);
        console.log(`❌ Client Errors: ${errorCount}`);
        
        if (errorCount === 0) {
          console.log('🎉 SUCCESS: Нет client_error! Проблема устранена.');
        } else {
          console.log('⚠️ WARNING: Обнаружены client_error. Нужна дополнительная диагностика.');
        }
        
        // Восстанавливаем оригинальный console.error
        console.error = originalError;
      }, 2000);
    }, 1000);
    
  } else {
    console.log('ℹ️ Для полной проверки перейдите на /admin/activity-monitor');
  }
})();
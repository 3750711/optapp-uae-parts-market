# Настройка переменных окружения для мониторинга

## ✅ Обязательная переменная для production monitoring

Для включения мониторинга производительности в production, добавьте следующую переменную окружения:

```bash
VITE_ENABLE_PERFORMANCE_MONITORING=true
```

### Способы установки:

#### 1. Через Lovable Dashboard (рекомендуется)
1. Откройте настройки проекта в Lovable
2. Перейдите в раздел "Environment Variables"
3. Добавьте новую переменную:
   - Key: `VITE_ENABLE_PERFORMANCE_MONITORING`
   - Value: `true`
4. Сохраните изменения

#### 2. Через файл `.env.local` (для локальной разработки)
Создайте файл `.env.local` в корне проекта:
```bash
VITE_ENABLE_PERFORMANCE_MONITORING=true
```

## Что дает эта переменная?

С установленной переменной:
- ✅ Метрики производительности собираются в production
- ✅ Критичные события (20+ рендеров, долгая загрузка) отправляются на backend
- ✅ Автоматическая отправка метрик каждые 5 минут
- ✅ Мониторинг циклических вызовов и производительности AuthContext

Без переменной:
- ⚠️ Мониторинг работает только в development режиме
- ⚠️ Нет visibility в production проблемы

## Проверка

После установки переменной, в консоли браузера (production) вы должны увидеть:
```
📤 Sending periodic performance metrics...
```

## Опциональная переменная (для Sentry)

Если используете Sentry для error tracking:
```bash
VITE_SENTRY_DSN=your_sentry_dsn_here
```

Получить DSN можно на https://sentry.io после создания проекта.

# Notification Queue System v2.0 - Deployment Guide

## 📋 Checklist перед деплоем

### ✅ Stage 1: SQL Migration (ВЫПОЛНЕНО)
- [x] Создана таблица `notification_queue`
- [x] Созданы индексы для производительности
- [x] Созданы функции `get_queue_metrics()`, `cleanup_old_notifications()`, `retry_dead_letter_notification()`
- [x] Настроены RLS политики

### ✅ Stage 2: Components (ВЫПОЛНЕНО)
- [x] `NotificationLogger.ts` - логирование
- [x] `ImageOptimizer.ts` - оптимизация изображений
- [x] `TelegramApiClient.ts` - API клиент с retry
- [x] `ProductNotificationHandler.ts` - обработка продуктов (72ч кулдаун)
- [x] `NotificationQueueSystem.ts` - система очередей
- [x] `index.ts` - обновлен главный файл
- [x] `QueueMonitor.tsx` - компонент мониторинга для админки

---

## 🧪 Stage 3: Локальное тестирование

### 1. Запуск функции локально

```bash
# Убедитесь что вы в корне проекта
cd /path/to/project

# Запустите Edge Function локально
supabase functions serve send-telegram-notification --env-file .env.local
```

### 2. Тестовые запросы

#### Тест 1: Product notification (repost)
```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-telegram-notification' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"productId": "existing-product-uuid", "notificationType": "repost"}'
```

#### Тест 2: Product notification (sold)
```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-telegram-notification' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"productId": "existing-product-uuid", "notificationType": "sold"}'
```

#### Тест 3: Order notification
```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-telegram-notification' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"order": {"id": "order-uuid"}, "action": "create"}'
```

### 3. Проверка очереди в БД

```sql
-- Посмотреть метрики очереди
SELECT * FROM get_queue_metrics();

-- Посмотреть все элементы в очереди
SELECT * FROM notification_queue 
ORDER BY created_at DESC 
LIMIT 10;

-- Посмотреть Dead Letter Queue
SELECT * FROM notification_queue 
WHERE status = 'dead_letter'
ORDER BY created_at DESC;

-- Посмотреть статистику
SELECT * FROM notification_queue_stats;
```

### 4. Ожидаемые результаты

✅ **Успешный запрос:**
```json
{
  "success": true,
  "message": "Notification queued successfully",
  "queueId": "uuid",
  "priority": "normal"
}
```

✅ **В логах Edge Function:**
```
✅ Queue system initialized and started
📨 Received request: {...}
✅ Notification queued successfully: uuid
⚙️ [Queue] Processing product notification (priority: normal)
✅ [Queue] Completed product in 1234ms
```

✅ **В таблице `notification_queue`:**
- `status` должен измениться с `pending` → `processing` → `completed`
- `processed_at` должен быть заполнен
- `processing_time_ms` должен содержать время обработки

---

## 🚀 Stage 4: Production Deployment

### 1. Деплой Edge Function

```bash
# Деплой функции в production
supabase functions deploy send-telegram-notification

# Проверка деплоя
supabase functions list
```

### 2. Первый тестовый запуск в продакшене

Выберите один товар со статусом `active` и отправьте тестовое уведомление:

```bash
curl -i --location --request POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-telegram-notification' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"productId": "test-product-uuid", "notificationType": "status_change"}'
```

### 3. Проверка работы

1. **Логи Edge Function:** https://supabase.com/dashboard/project/vfiylfljiixqkjfqubyq/functions/send-telegram-notification/logs
2. **Telegram группа:** Проверьте что уведомление пришло
3. **БД:** Проверьте `notification_queue` и `products` таблицы
4. **Admin Panel:** Откройте страницу мониторинга очереди

---

## 📊 Stage 5: Monitoring (48 часов)

### Что мониторить:

#### 1. Edge Function Logs
- Ошибки инициализации
- Таймауты
- API ошибки Telegram

#### 2. Database Metrics
```sql
-- Каждый час проверяйте:
SELECT * FROM get_queue_metrics();

-- Проверяйте Dead Letter Queue:
SELECT count(*) as dead_letters 
FROM notification_queue 
WHERE status = 'dead_letter';
```

#### 3. Admin Dashboard
- Зайдите в админку: `/admin/notifications`
- Проверяйте метрики каждые 2-4 часа
- Если есть элементы в Dead Letter Queue - нажмите "Повторить"

#### 4. Products Table
```sql
-- Проверьте что обновляются поля:
SELECT 
  id,
  title,
  tg_notify_status,
  tg_notify_attempts,
  last_notification_sent_at
FROM products 
WHERE tg_notify_status IS NOT NULL
ORDER BY updated_at DESC 
LIMIT 10;
```

---

## 🔧 Troubleshooting

### Проблема: Очередь не обрабатывается

**Решение:**
```sql
-- Сбросить застрявшие элементы
UPDATE notification_queue 
SET status = 'pending', attempts = 0 
WHERE status = 'processing' 
AND updated_at < NOW() - INTERVAL '5 minutes';
```

### Проблема: WEBPAGE_MEDIA_EMPTY ошибка

**Причина:** Cloudinary изображения недоступны для Telegram  
**Решение:** Автоматический retry (3 попытки с задержкой 2 сек)

### Проблема: Кулдаун 72 часа не работает

**Проверка:**
```sql
SELECT 
  id,
  title,
  last_notification_sent_at,
  EXTRACT(EPOCH FROM (NOW() - last_notification_sent_at))/3600 as hours_since_last
FROM products 
WHERE last_notification_sent_at IS NOT NULL
ORDER BY last_notification_sent_at DESC;
```

---

## 🎯 Success Criteria

### После 48 часов мониторинга:

✅ **Критерии успеха:**
- [ ] 95%+ уведомлений в статусе `completed`
- [ ] < 5 элементов в Dead Letter Queue
- [ ] Нет ошибок в Edge Function логах
- [ ] `tg_notify_status` обновляется корректно
- [ ] 72-часовой кулдаун работает для repost
- [ ] Приоритеты работают (sold и order обрабатываются первыми)
- [ ] Среднее время обработки < 5 секунд

✅ **После успешного прохождения:**
- Можно удалить старые файлы (`telegram-api.ts`, `product-notification.ts`, `order-notification.ts`)
- Система готова к продакшену

---

## 📚 Архитектура

```
User Request → index.ts → Queue System → Database (notification_queue)
                            ↓
                    Background Processing (every 2s)
                            ↓
                    ProductNotificationHandler
                            ↓
                    TelegramApiClient → Telegram API
                            ↓
                    Success → Update products table
                    Failure → Retry with backoff
                    Max Attempts → Dead Letter Queue
```

---

## 🔐 Security Checklist

- [x] RLS включен на `notification_queue`
- [x] Только `service_role` может управлять очередью
- [x] Admins могут просматривать и retry
- [x] Логирование не содержит sensitive данных
- [x] Idempotency через `request_id`

---

## 📞 Support

При возникновении проблем:
1. Проверьте логи Edge Function
2. Проверьте таблицу `notification_queue`
3. Проверьте Admin Dashboard
4. Проверьте Dead Letter Queue

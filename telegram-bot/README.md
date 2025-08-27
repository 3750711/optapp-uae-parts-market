# Order Media Telegram Bot

Telegram bot для загрузки фотографий заказов в Cloudinary и сохранения в Supabase.

## Установка

1. Установите зависимости:
```bash
npm install
```

2. Создайте файл `.env` на основе `.env.example`:
```bash
cp .env.example .env
```

3. Заполните переменные окружения в `.env`:

### Telegram Bot
- `TELEGRAM_BOT_TOKEN` - токен бота от @BotFather
- `ADMIN_TG_IDS` - ID администраторов через запятую (получите от @userinfobot)

### Cloudinary
- `CLOUDINARY_CLOUD_NAME` - имя облака
- `CLOUDINARY_API_KEY` - API ключ
- `CLOUDINARY_API_SECRET` - секретный ключ
- `CLOUDINARY_UPLOAD_FOLDER` - папка для загрузки (по умолчанию: orders)

### Supabase
- `SUPABASE_URL` - URL проекта Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key (НЕ anon key!)

## Запуск

### Разработка
```bash
npm run dev
```

### Продакшн
```bash
npm start
```

## Использование

1. В админке заказа нажмите кнопку "📷 Загрузить из Telegram"
2. Откроется бот с контекстом заказа
3. Отправьте фото - оно автоматически загрузится в Cloudinary и сохранится в БД
4. Обновите страницу в админке, чтобы увидеть новые фото

## Особенности

- ✅ Принимает только фото
- ❌ Отклоняет видео, документы, стикеры
- 🔐 Доступ только для администраторов (по Telegram ID)
- 📦 Привязка к конкретному заказу через deep-link
- 🔄 Realtime обновления в админке (опционально)

## Деплой

Бот можно развернуть на любой платформе:
- Railway
- Render
- Fly.io
- VPS с PM2

### Пример с PM2
```bash
npm install -g pm2
pm2 start bot.js --name "order-media-bot"
pm2 startup
pm2 save
```
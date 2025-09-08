# Режим без Realtime

Система поддерживает временное отключение WebSocket/Realtime функциональности для стабильности или отладки.

## Как отключить Realtime

### Способ 1: Runtime конфигурация (рекомендуется)

Измените `public/runtime-config.json`:

```json
{
  "SUPABASE_URL": "https://api.partsbay.ae",
  "REALTIME_ENABLED": false,
  "DEBUG_AUTH": false
}
```

### Способ 2: Environment переменные

Установите в `.env`:

```
VITE_REALTIME_ENABLED=false
```

## Что происходит при отключении

✅ **Продолжает работать:**
- Авторизация (вход/выход/регистрация)
- Обновление профиля через HTTP API
- Все REST запросы к Supabase
- Навигация и защищённые роуты
- React Query кэширование

🚫 **Отключается:**
- WebSocket соединения
- Real-time уведомления
- Live обновления данных
- Каналы Supabase (`postgres_changes`)

## Проверка статуса

1. В DevTools → Network — нет активных `wss://` соединений
2. На `/debug/auth-inspect` — статус флагов в секции "Feature Flags"
3. `supabase.getChannels()` возвращает пустой массив
4. В консоли нет ошибок про Realtime

## Включение обратно

Верните `REALTIME_ENABLED: true` в runtime-config.json или уберите env переменную.

## Отладка

Включите детальные логи:

```json
{
  "REALTIME_ENABLED": true,
  "DEBUG_AUTH": true
}
```

Логи будут показывать:
- `[RT]` - события realtime менеджера
- `[AUTH]` - события авторизации  
- `[FLAGS]` - состояние флагов

## Файлы системы

- `src/config/flags.ts` - конфигурация флагов
- `src/utils/realtimeManager.ts` - менеджер realtime соединений
- `src/contexts/AuthContext.tsx` - интеграция с авторизацией
- `src/hooks/useNotifications.ts` - пример использования флагов
- `public/runtime-config.json` - runtime конфигурация
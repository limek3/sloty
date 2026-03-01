# TG Booking Mini App (React + Supabase + Telegraf)

## Быстрый старт
### 1) Установка
```bash
pnpm i
```

### 2) Supabase
1. Создай проект Supabase.
2. Выполни миграцию: `supabase/migrations/0001_init.sql` (в SQL editor).
3. Deploy Edge Functions (все папки в `supabase/functions/`):
   - get_master, list_services, get_available_slots, create_appointment, my_appointments, cancel_appointment, reschedule_appointment
   - master_me, master_update_profile, master_list_services, master_upsert_service, master_delete_service
   - master_get_working_hours, master_set_working_hours, master_list_appointments, master_cancel_appointment
   - send_reminders
4. В env Functions добавь:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - TELEGRAM_BOT_TOKEN
   - (опц.) REMINDERS_SECRET

### 3) Web (Mini App)
Создай `apps/web/.env`:
```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Запуск:
```bash
pnpm dev:web
```

Деплой: любой HTTPS-хостинг (Vercel/Netlify/Render).

### 4) Bot (Telegraf)
Создай `apps/bot/.env`:
```bash
TELEGRAM_BOT_TOKEN=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
WEBAPP_URL=https://your-miniapp-domain.com
BOT_USERNAME=your_bot_username
```

Запуск:
```bash
pnpm dev:bot
```

### 5) Напоминания
Cron дергает Edge Function:
POST `.../functions/v1/send_reminders`
body: `{ "secret": "..." }`

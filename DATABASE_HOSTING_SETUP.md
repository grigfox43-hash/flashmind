# Инструкция по созданию Бесплатной Облачной Базы Данных (PostgreSQL / Supabase)

Все данные веб-приложения FlashMind AI могут храниться централизованно на удаленном сервере (в облачной базе данных PostgreSQL).

---

## Вариант 1. Бесплатная база данных на Supabase (Рекомендуется - 2 минуты)

Supabase предоставляет бесплатный PostgreSQL с REST API без необходимости настраивать сервер вручную.

### Шаг 1. Зарегистрируйтесь на Supabase
1. Перейдите на [supabase.com](https://supabase.com) и нажмите **Start your project**.
2. Войдите через GitHub.
3. Создайте новый проект (например: `flashmind-db`). Укажите пароль для БД.

### Шаг 2. Создайте таблицы (SQL скрипт)
Перейдите в раздел **SQL Editor** в левом меню Supabase и выполните следующий скрипт:

```sql
-- 1. Таблица Пользователей
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    joined_at TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Таблица Колод и Флеш-карточек
CREATE TABLE IF NOT EXISTS public.decks (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.users(id),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    color TEXT,
    cards_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Открыть бесплатный доступ чтения/записи для REST API
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Users Access" ON public.users FOR ALL USING (true);
CREATE POLICY "Public Decks Access" ON public.decks FOR ALL USING (true);
```

### Шаг 3. Подключите БД в приложении FlashMind AI
1. Перейдите в **Project Settings -> API** в Supabase.
2. Скопируйте **Project URL** (например: `https://xyzcompany.supabase.co`) и **anon public key**.
3. В приложении FlashMind нажмите на кнопку **Облако БД** в шапке и вставьте полученные данные.
4. Готово! Все карточки, колоды и пользователи теперь сохраняются непосредственно в облачную базу данных PostgreSQL на хостинге.

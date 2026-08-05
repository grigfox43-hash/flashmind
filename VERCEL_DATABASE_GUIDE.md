# Пошаговая инструкция: Публикация на Vercel и подключение Neon (Vercel Postgres)

Вы открыли раздел **Marketplace Database Providers** в Vercel!

---

## Как за 15 секунд включить PostgreSQL с вашего экрана (Скриншота):

На вашем скриншоте отображены официальные партнеры Vercel по базам данных:

### Самый лучший вариант — Neon (Serverless Postgres)
> **Neon** — это и есть официальный управляемый PostgreSQL для Vercel (ранее именовался Vercel Postgres). Он на 100% бесплатный и запускается мгновенно.

### Пошаговые действия с вашего экрана:

1. **Нажмите на первую строчку на вашем экране: Neon (Serverless Postgres)**.
2. Нажмите синюю кнопку **Connect** / **Create Database**.
3. Выберите ваш проект `flash_hisapp`.
4. В появившейся консоли (SQL Editor / Tables) выполните данный SQL-скрипт создания таблиц:

```sql
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    joined_at TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS decks (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    color TEXT,
    cards_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

5. Скопируйте полученную ссылку подключения `Connection String / Postgres URL` и **Anon Key**.
6. В приложении FlashMind на десктопе или смартфоне нажмите на кнопку **«Облако БД»** в верхней шапке и вставьте полученные данные.
7. Нажмите **Сохранить**. База данных PostgreSQL заработает в облаке!

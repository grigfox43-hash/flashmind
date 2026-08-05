# FlashMind AI — Система Интервального Повторения (SM-2 SRS)

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-emerald?style=for-the-badge&logo=vercel)](https://flashmind.vercel.app)
[![React 19](https://img.shields.io/badge/React-19.0-indigo?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-cyan?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)

**FlashMind AI** — это веб-приложение для подготовки к экзаменам, тестированиям и изучению любых предметов по алгоритму SuperMemo-2 (SM-2) с возможностью автоматической генерации карточек из PDF и конспектов лекций.

---

## 🚀 Основные возможности:
- 🧠 **Алгоритм SuperMemo-2 (SM-2)**: Расчет оптимальных интервалов повторений, множителей легкой памяти (`easeFactor`) и расписания.
- 📄 **Генератор ИИ карточек из PDF и Текста**: Клиентский парсинг PDF через `pdfjs-dist` + ИИ эвристический парсер NLP и поддержка Google Gemini API.
- 🎓 **Имитатор Экзаменов**: Запуск тестовых сессий с расчетом индекса готовности (0–100%) и детальной аналитикой слабых тем.
- 🗄️ **База Данных**: Локальная браузерная IndexedDB + возможность 1-click подключения облачной базы данных PostgreSQL (Vercel Postgres / Supabase).
- 📱 **Адаптивный интерфейс**: Оптимизированный дизайн для мобильных устройств с плавающим меню навигации.

---

## 🛠️ Запуск локально:
```bash
npm install
npm run dev
```

## 📦 Сборка для продакшена:
```bash
npm run build
```

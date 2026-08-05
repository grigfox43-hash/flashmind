import React from 'react';
import {
  Brain,
  Sparkles,
  Zap,
  CheckCircle2,
  ArrowRight,
  FileText,
  BarChart3,
  UserPlus,
  LogIn,
} from 'lucide-react';

interface LandingPageProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenLogin,
  onOpenRegister,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white flex flex-col relative overflow-hidden">
      {/* Background Ambient Glow Orbs */}
      <div className="bg-ambient-container">
        <div className="ambient-orb-1" />
        <div className="ambient-orb-2" />
        <div className="ambient-orb-3" />
      </div>
      {/* Header Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                FlashMind AI
              </span>
              <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                SRS Platform
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenLogin}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Войти</span>
            </button>

            <button
              onClick={onOpenRegister}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Зарегистрироваться</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 max-w-7xl mx-auto text-center space-y-8 animate-fadeIn">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold">
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span>Умная подготовка к экзаменам на базе ИИ</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-tight">
          Учись в <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">3 раза быстрее</span> с интервальным повторением
        </h1>

        <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Загружай конспекты, PDF и лекции — ИИ автоматически создаст флеш-карточки и составит персональный график повторений по алгоритму SM-2.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={onOpenRegister}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-base shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Начать бесплатно</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={onOpenLogin}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-base transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Войти в аккаунт</span>
          </button>
        </div>

        <div className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Алгоритм SuperMemo-2</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Авто-генерация из PDF</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Индекс готовности к экзамену</span>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="py-16 bg-slate-900/50 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Все инструменты для эффективной учебы</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              Инновационные функции для студентов, школьников и профессионалов
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-3xl space-y-4 hover:border-indigo-500/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">ИИ Парсер PDF и Текстов</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Просто загрузи файл учебника или скопируй конспект. Алгоритм выделит главные тезисы и автоматически сформирует флеш-карточки.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-3xl space-y-4 hover:border-purple-500/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Алгоритм SM-2 (SRS)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Система анализирует сложность ответа и рассчитывает точную дату следующего повторения прямо перед тем, как ты начнёшь забывать.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-3xl space-y-4 hover:border-emerald-500/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Симулятор Экзамена</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Проходи контрольные тестирования в реальном времени. Приложение покажет процент готовности и слабые темы для проработки.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Как это работает?</h2>
          <p className="text-slate-400 text-sm">3 простых шага к высшему баллу</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center mx-auto text-lg">
              1
            </div>
            <h4 className="font-bold text-white">Загрузи учебный материал</h4>
            <p className="text-xs text-slate-400">Вставь конспект лекции или файл учебника в формате PDF.</p>
          </div>

          <div className="space-y-4">
            <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-black flex items-center justify-center mx-auto text-lg">
              2
            </div>
            <h4 className="font-bold text-white">Получи умные карточки</h4>
            <p className="text-xs text-slate-400">ИИ сразу выделит вопрос-ответ и добавит удобные подсказки.</p>
          </div>

          <div className="space-y-4">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center mx-auto text-lg">
              3
            </div>
            <h4 className="font-bold text-white">Повторяй в идеальное время</h4>
            <p className="text-xs text-slate-400">Занимайся по 10 минут в день и сдавай любые тесты без стресса.</p>
          </div>
        </div>

        {/* CTA Box */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border border-indigo-500/30 text-center space-y-6">
          <h3 className="text-2xl font-bold text-white">Готовы начать эффективное обучение?</h3>
          <p className="text-xs text-slate-300 max-w-lg mx-auto">
            Создайте личный кабинет за 10 секунд и получите доступ ко всем функциям приложения.
          </p>
          <button
            onClick={onOpenRegister}
            className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm transition-all shadow-lg shadow-indigo-600/30 cursor-pointer inline-flex items-center gap-2"
          >
            <span>Создать аккаунт</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        FlashMind AI — Интеллектуальная платформа интервального повторения
      </footer>
    </div>
  );
};

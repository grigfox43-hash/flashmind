import React from 'react';
import {
  Sparkles,
  Brain,
  Upload,
  BookOpen,
  GraduationCap,
  BarChart3,
  Key,
  Flame,
  Layers,
  LogIn,
} from 'lucide-react';
import type { UserProfile } from './UserCabinetModal';

interface NavbarProps {
  activeTab: 'dashboard' | 'import' | 'review' | 'exam' | 'decks';
  setActiveTab: (tab: 'dashboard' | 'import' | 'review' | 'exam' | 'decks') => void;
  dueTodayCount: number;
  readinessScore: number;
  streakDays: number;
  onOpenApiKeyModal: () => void;
  hasApiKey: boolean;
  currentUser: UserProfile | null;
  onOpenUserCabinet: () => void;
  onOpenCloudDbModal: () => void;
  isCloudConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  dueTodayCount,
  readinessScore,
  streakDays,
  onOpenApiKeyModal,
  hasApiKey,
  currentUser,
  onOpenUserCabinet,
}) => {
  return (
    <>
      {/* Top Main Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-4">
          {/* Brand Logo & Title */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer shrink-0"
          >
            <div className="relative">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950" title="Онлайн" />
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent leading-none">
                  FlashMind
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  AI SRS
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium tracking-wide mt-0.5 hidden xs:block">
                Интервальное повторение
              </p>
            </div>
          </div>

          {/* Center Main Navigation Bar */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800/80 shadow-inner my-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Дашборд</span>
            </button>

            <button
              onClick={() => setActiveTab('import')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'import'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Материалы</span>
              <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
            </button>

            <button
              onClick={() => setActiveTab('review')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer relative ${
                activeTab === 'review'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Повторение</span>
              {dueTodayCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-extrabold rounded-full bg-rose-500 text-white shadow-sm animate-bounce">
                  {dueTodayCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('exam')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'exam'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Тесты</span>
            </button>

            <button
              onClick={() => setActiveTab('decks')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'decks'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Колоды</span>
            </button>
          </nav>

          {/* Right Status Controls & User Account Pill */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Study Streak */}
            <div
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold"
              title="Дней подряда в процессе обучения"
            >
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span>{streakDays} дн.</span>
            </div>

            {/* Exam Readiness Indicator */}
            <div
              onClick={() => setActiveTab('dashboard')}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold cursor-pointer hover:border-slate-700 transition-colors"
              title="Индекс готовности к экзамену"
            >
              <span className="text-slate-400 font-medium">Готовность:</span>
              <span
                className={
                  readinessScore >= 80
                    ? 'text-emerald-400'
                    : readinessScore >= 50
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }
              >
                {readinessScore}%
              </span>
            </div>

            {/* Gemini API Key Button */}
            <button
              onClick={onOpenApiKeyModal}
              className={`p-2 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                hasApiKey
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
              }`}
              title={hasApiKey ? 'Gemini API Подключен' : 'Настроить Gemini API'}
            >
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden xl:inline">
                {hasApiKey ? 'Gemini Active' : 'API Ключ'}
              </span>
            </button>

            {/* Unified User Account Button */}
            <button
              onClick={onOpenUserCabinet}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold shadow-md transition-colors cursor-pointer ${
                currentUser
                  ? 'bg-gradient-to-r from-slate-900 to-indigo-950/80 border-indigo-500/40 text-slate-100'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500'
              }`}
            >
              {currentUser ? (
                <>
                  <div className="w-5 h-5 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[11px] font-black">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline">{currentUser.name}</span>
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Войти</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Floating Mobile Bottom Navigation Dock Bar */}
      <nav className="fixed bottom-3 left-3 right-3 z-[100] md:hidden pointer-events-auto">
        <div className="max-w-md mx-auto rounded-2xl border border-slate-800/90 bg-slate-950/95 backdrop-blur-2xl px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] justify-around items-center flex text-[10px] font-bold shadow-[0_10px_30px_rgba(0,0,0,0.9)] border-indigo-500/20">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'dashboard' ? 'text-indigo-400 font-bold bg-indigo-500/15' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4 mb-0.5" />
            <span>Дашборд</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'import' ? 'text-indigo-400 font-bold bg-indigo-500/15' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4 mb-0.5" />
            <span>Материалы</span>
          </button>

          <button
            onClick={() => setActiveTab('review')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl relative transition-colors cursor-pointer ${
              activeTab === 'review' ? 'text-indigo-400 font-bold bg-indigo-500/15' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4 mb-0.5" />
            <span>Повтор</span>
            {dueTodayCount > 0 && (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('exam')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'exam' ? 'text-indigo-400 font-bold bg-indigo-500/15' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GraduationCap className="w-4 h-4 mb-0.5" />
            <span>Тесты</span>
          </button>

          <button
            onClick={() => setActiveTab('decks')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'decks' ? 'text-indigo-400 font-bold bg-indigo-500/15' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4 mb-0.5" />
            <span>Колоды</span>
          </button>
        </div>
      </nav>
    </>
  );
};

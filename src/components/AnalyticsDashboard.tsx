import React from 'react';
import {
  Brain,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
  ArrowRight,
  Upload,
  BookOpen,
  Flame,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import type { Deck } from '../types/flashcard';
import { calculateExamReadiness, type ExamReadinessOverview } from '../utils/analytics';

interface AnalyticsDashboardProps {
  decks: Deck[];
  onNavigate: (tab: 'import' | 'review' | 'exam' | 'decks') => void;
  streakDays: number;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  decks,
  onNavigate,
  streakDays,
}) => {
  const readiness: ExamReadinessOverview = calculateExamReadiness(decks);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 animate-fadeIn">
      {/* Top Banner & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exam Readiness Score Gauge */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
                <Target className="w-3.5 h-3.5" />
                Индекс готовности к экзамену
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold">
                <Flame className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span>{streakDays} дн. подряд</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pt-2">
              <div>
                <h2 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent tracking-tight">
                  {readiness.overallScore}%
                </h2>
                <p className={`text-base font-bold mt-1 ${readiness.readinessColor}`}>
                  {readiness.readinessLabel}
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-md">
                  Расчитано на основе алгоритма SM-2: точности ответов, доли усвоенных карточек и отсутствия просроченных повторений.
                </p>
              </div>

              {/* Action Buttons (Stacked Vertically) */}
              <div className="flex flex-col gap-2.5 w-full sm:w-52 shrink-0 pt-2 sm:pt-0">
                <button
                  onClick={() => onNavigate('review')}
                  className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 border border-indigo-400/30 transition-all flex items-center justify-center gap-2.5 whitespace-nowrap cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 shrink-0" />
                  <span>Повторить</span>
                  {readiness.dueTodayCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-black leading-none">
                      {readiness.dueTodayCount}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-slate-200 text-[11px] font-bold leading-none">
                      0
                    </span>
                  )}
                </button>

                <button
                  onClick={() => onNavigate('import')}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-indigo-500/50 text-slate-100 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>Создать через ИИ</span>
                </button>
              </div>
            </div>
          </div>

          {/* Progress Bar Gauge */}
          <div className="mt-6 space-y-2">
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${readiness.overallScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Card status count */}
          <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-white">{readiness.masteredCount}</div>
              <div className="text-xs text-slate-400 font-medium">Усвоено (Mastered)</div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Brain className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-white">{readiness.learningCount}</div>
              <div className="text-xs text-slate-400 font-medium">В процессе (Learning)</div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-white">{readiness.dueTodayCount}</div>
              <div className="text-xs text-slate-400 font-medium">На сегодня (Due)</div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-white">{readiness.retentionRate}%</div>
              <div className="text-xs text-slate-400 font-medium">Точность запоминания</div>
            </div>
          </div>
        </div>
      </div>

      {/* Weak Topics Section */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Слабые темы и уязвимости</h3>
              <p className="text-xs text-slate-400">
                Темы с наибольшим числом ошибок и низким процентом правильных ответов
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('review')}
            className="hidden sm:flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span>Повторить проблемные темы</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {readiness.weakTopics.length === 0 ? (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm text-center">
            🎉 У вас нет критически слабых тем! Отличный результат в повторениях.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {readiness.weakTopics.map((wt) => (
              <div
                key={wt.topicTag}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 relative group hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-sm">{wt.topicTag}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      wt.urgency === 'high'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {wt.urgency === 'high' ? 'Высокий риск' : 'Требует внимания'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Точность ответов:</span>
                  <span
                    className={`font-bold ${
                      wt.accuracy < 60 ? 'text-rose-400' : 'text-amber-400'
                    }`}
                  >
                    {wt.accuracy}%
                  </span>
                </div>

                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      wt.accuracy < 60 ? 'bg-rose-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${wt.accuracy}%` }}
                  />
                </div>

                <button
                  onClick={() => onNavigate('review')}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 text-xs font-semibold transition-all mt-2"
                >
                  Укрепить знания по теме
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Decks Quick Overview Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Мои Учебные Колоды ({decks.length})</h3>
          <button
            onClick={() => onNavigate('decks')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
          >
            <span>Управление колодами</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {decks.length === 0 ? (
          <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
              <Upload className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xl font-bold text-white">У вас пока нет созданных колод</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Загрузите свой первый конспект лекции или PDF-файл — ИИ мгновенно сформирует флеш-карточки для обучения.
              </p>
            </div>
            <button
              onClick={() => onNavigate('import')}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-lg shadow-indigo-600/30 inline-flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Создать первую колоду через ИИ</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {decks.map((deck) => {
              const dueCount = deck.cards.filter((c) => c.dueDate <= new Date().toISOString().split('T')[0]).length;
              return (
                <div
                  key={deck.id}
                  onClick={() => onNavigate('review')}
                  className={`p-6 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer space-y-4 group`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
                      {deck.category}
                    </span>
                    {dueCount > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">
                        {dueCount} к повторению
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                      {deck.title}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                      {deck.description || 'Учебные карточки'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                    <span>Всего карточек: {deck.cards.length}</span>
                    <span className="font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      Учить <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { User, LogOut, Mail, Calendar, X, Loader2 } from 'lucide-react';
import { appDB } from '../db/database';
import { cloudDB } from '../db/cloudDatabase';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  joinedAt: string;
}

interface UserCabinetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
  initialMode?: 'login' | 'register';
  totalCards: number;
  readinessScore: number;
  streakDays: number;
}

export const UserCabinetModal: React.FC<UserCabinetModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
  initialMode = 'login',
  totalCards,
  readinessScore,
  streakDays,
}) => {
  const [isRegisterMode, setIsRegisterMode] = useState(initialMode === 'register');
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [passInput, setPassInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    setIsRegisterMode(initialMode === 'register');
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setIsSubmitting(true);
    setAuthError(null);

    try {
      const email = emailInput.trim().toLowerCase();
      const existing = await appDB.getUserByEmail(email);

      if (isRegisterMode) {
        if (existing) {
          throw new Error('Пользователь с таким email уже зарегистрирован. Перейдите во вкладку «Войти».');
        }

        const name = nameInput.trim() || email.split('@')[0] || 'Студент';
        const user: UserProfile = {
          id: `usr_${Date.now()}`,
          name,
          email,
          joinedAt: new Date().toLocaleDateString('ru-RU'),
        };

        await appDB.saveUser(user);
        if (cloudDB.isCloudConfigured()) {
          await cloudDB.syncUserToCloud(user);
        }
        onLogin(user);
        onClose();
      } else {
        // Sign in mode: Strict check that user profile exists in database
        if (!existing) {
          throw new Error('Пользователь с таким email не найден. Нажмите «Зарегистрироваться» ниже.');
        }

        onLogin(existing);
        onClose();
      }
    } catch (err: any) {
      setAuthError(err.message || 'Ошибка авторизации. Проверьте введенные данные.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoutClick = () => {
    onLogout();
    setIsRegisterMode(false);
    setEmailInput('');
    setNameInput('');
    setPassInput('');
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-backdrop-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl animate-modal-pop cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                {currentUser ? 'Личный кабинет' : isRegisterMode ? 'Регистрация' : 'Вход в аккаунт'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Интеллектуальное обучение FlashMind
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Logged-In Profile View */}
        {currentUser ? (
          <div className="space-y-6">
            {/* User Profile Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/30 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-600/40">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>{currentUser.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Активный студент
                  </span>
                </h4>
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{currentUser.email}</span>
                </p>
                <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Дата регистрации: {currentUser.joinedAt}</span>
                </p>
              </div>
            </div>

            {/* User Personal Statistics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <div className="text-xl font-bold text-indigo-400">{totalCards}</div>
                <div className="text-[11px] text-slate-400">Карточек</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <div className="text-xl font-bold text-emerald-400">{readinessScore}%</div>
                <div className="text-[11px] text-slate-400">Готовность</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <div className="text-xl font-bold text-amber-400">{streakDays} дн.</div>
                <div className="text-[11px] text-slate-400">Серия учебы</div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogoutClick}
              className="w-full py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Выйти из аккаунта</span>
            </button>
          </div>
        ) : (
          /* Login / Registration Form */
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {authError}
              </div>
            )}

            {isRegisterMode && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Ваше Имя / Никнейм</label>
                <input
                  type="text"
                  required
                  placeholder="Александр Иванов"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Email адрес</label>
              <input
                type="email"
                required
                placeholder="student@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Пароль</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={passInput}
                onChange={(e) => setPassInput(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-colors shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isRegisterMode ? (
                'Создать аккаунт'
              ) : (
                'Войти в личный кабинет'
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsRegisterMode(!isRegisterMode)}
                className="text-xs text-indigo-400 hover:underline cursor-pointer"
              >
                {isRegisterMode ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

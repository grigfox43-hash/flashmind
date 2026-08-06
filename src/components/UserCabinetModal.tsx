import React, { useState, useEffect } from 'react';
import { User, LogOut, Mail, Calendar, X, Loader2, MailCheck, ExternalLink, Copy, Check } from 'lucide-react';
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
  onLogin: (user: UserProfile, isNewUser?: boolean) => void;
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
  const [copiedLink, setCopiedLink] = useState(false);

  // Verification Pending Screen State
  const [pendingVerification, setPendingVerification] = useState<{
    user: UserProfile;
    activationUrl: string;
  } | null>(null);

  useEffect(() => {
    setIsRegisterMode(initialMode === 'register');
    setPendingVerification(null);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setIsSubmitting(true);
    setAuthError(null);

    try {
      const email = emailInput.trim().toLowerCase();
      const existingLocal = await appDB.getUserByEmail(email);
      const existingCloud = await cloudDB.getUserByEmailFromCloud(email);
      const existing = existingLocal || existingCloud;

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

        // Create pending verification token
        const token = `verify_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const activationUrl = `${window.location.origin}/?verifyToken=${token}&email=${encodeURIComponent(email)}`;

        // Save pending registration record
        const pendingRecord = { user, token, createdAt: Date.now() };
        localStorage.setItem(`flashmind_pending_${token}`, JSON.stringify(pendingRecord));
        localStorage.setItem(`flashmind_pending_email_${email}`, JSON.stringify(pendingRecord));

        setPendingVerification({
          user,
          activationUrl,
        });
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

  const handleCopyActivationLink = () => {
    if (!pendingVerification) return;
    navigator.clipboard.writeText(pendingVerification.activationUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleActivateImmediately = async () => {
    if (!pendingVerification) return;
    const { user } = pendingVerification;
    await appDB.saveUser(user);
    if (cloudDB.isCloudConfigured()) {
      await cloudDB.syncUserToCloud(user);
    }
    onLogin(user, true);
    setPendingVerification(null);
    onClose();
  };

  const handleLogoutClick = () => {
    onLogout();
    setIsRegisterMode(false);
    setEmailInput('');
    setNameInput('');
    setPassInput('');
    setPendingVerification(null);
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
                {currentUser
                  ? 'Личный кабинет'
                  : pendingVerification
                  ? 'Подтверждение Email'
                  : isRegisterMode
                  ? 'Регистрация'
                  : 'Вход в аккаунт'}
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

        {/* Email Verification Pending Screen */}
        {pendingVerification ? (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20 animate-pulse">
              <MailCheck className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-semibold">
                ✉️ Ожидает подтверждения
              </span>
              <h4 className="text-xl font-bold text-white pt-1">
                Ссылка подтверждения отправлена!
              </h4>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                Мы выслали ссылку для подтверждения на <strong className="text-indigo-300">{pendingVerification.user.email}</strong>. Нажмите на нее, чтобы подтвердить Email и войти в кабинет.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-left">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Персональная ссылка активации:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={pendingVerification.activationUrl}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-indigo-300 font-mono focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyActivationLink}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Скопировано' : 'Копия'}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleActivateImmediately}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Перейти по ссылке подтверждения (Завершить)</span>
              </button>

              <button
                type="button"
                onClick={() => setPendingVerification(null)}
                className="text-xs text-slate-400 hover:text-slate-200 py-1"
              >
                ← Вернуться назад
              </button>
            </div>
          </div>
        ) : currentUser ? (
          /* Logged-In Profile View */
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
                    Подтвержденный Email
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
              className="w-full py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Выйти из аккаунта</span>
            </button>
          </div>
        ) : (
          /* Authentication Form */
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium leading-relaxed">
                ⚠️ {authError}
              </div>
            )}

            {isRegisterMode && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Ваше Имя</label>
                <input
                  type="text"
                  placeholder="Алексей"
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
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Обработка...</span>
                </>
              ) : (
                <span>{isRegisterMode ? 'Отправить ссылку подтверждения' : 'Войти в кабинет'}</span>
              )}
            </button>

            <div className="pt-2 text-center border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setAuthError(null);
                }}
                className="text-xs text-indigo-400 hover:underline font-medium cursor-pointer"
              >
                {isRegisterMode
                  ? 'Уже есть аккаунт? Войти'
                  : 'Еще нет аккаунта? Зарегистрироваться'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

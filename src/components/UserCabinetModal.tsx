import React, { useState, useEffect } from 'react';
import { User, LogOut, Mail, Calendar, X, Loader2, MailCheck, ExternalLink, RefreshCw, AlertCircle, Check, Copy } from 'lucide-react';
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
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Verification Pending Screen State
  const [pendingVerification, setPendingVerification] = useState<{
    user: UserProfile;
    activationUrl: string;
    dispatchError?: string;
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

        let dispatchErrorMsg = '';

        // Dispatch real email via serverless API
        try {
          const res = await fetch('/api/send-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name, activationUrl }),
          });
          const data = await res.json();
          if (!data.success && data.error) {
            dispatchErrorMsg = data.error;
          }
        } catch (e: any) {
          console.warn('Send verification API call error:', e);
        }

        setPendingVerification({
          user,
          activationUrl,
          dispatchError: dispatchErrorMsg,
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

  const handleResendEmail = async () => {
    if (!pendingVerification) return;
    setIsResending(true);
    try {
      const res = await fetch('/api/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingVerification.user.email,
          name: pendingVerification.user.name,
          activationUrl: pendingVerification.activationUrl,
        }),
      });
      const data = await res.json();
      if (!data.success && data.error) {
        setPendingVerification((prev) => (prev ? { ...prev, dispatchError: data.error } : null));
      } else {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsResending(false);
    }
  };

  const handleActivateManualFallback = async () => {
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

  const handleCopyActivationLink = () => {
    if (!pendingVerification) return;
    navigator.clipboard.writeText(pendingVerification.activationUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getMailProviderUrl = (email: string): string => {
    const domain = email.split('@')[1] || '';
    if (domain.includes('gmail')) return 'https://mail.google.com';
    if (domain.includes('yandex') || domain.includes('ya.ru')) return 'https://mail.yandex.ru';
    if (domain.includes('mail.ru') || domain.includes('bk.ru') || domain.includes('inbox.ru')) return 'https://e.mail.ru';
    if (domain.includes('outlook') || domain.includes('hotmail')) return 'https://outlook.live.com';
    return 'https://mail.google.com';
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
              <MailCheck className="w-8 h-8 text-indigo-400" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-semibold">
                ✉️ Запрос на отправку письма сформирован
              </span>
              <h4 className="text-xl font-bold text-white pt-1">
                Проверьте вашу почту
              </h4>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                Запрос отправлен на <strong className="text-indigo-300">{pendingVerification.user.email}</strong>. Зайдите в ваш почтовый ящик и нажмите на синюю ссылку активации.
              </p>
            </div>

            {/* Resend Free Tier Domain Limitation Info Box */}
            {pendingVerification.dispatchError && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 text-left space-y-2 leading-relaxed">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Примечание по отправке Resend API:</span>
                </div>
                <p>
                  В тестовом бесплатном тарифе Resend письма рассылаются <strong>только на ваш основной Email, с которого зарегистрирован аккаунт Resend</strong> ({pendingVerification.dispatchError}).
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleActivateManualFallback}
                    className="w-full py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold border border-amber-500/30 transition-all cursor-pointer text-xs flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Подтвердить данный аккаунт прямо сейчас</span>
                  </button>
                </div>
              </div>
            )}

            {!pendingVerification.dispatchError && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400 space-y-2 text-left leading-relaxed">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold">
                  <span>🛡️ Защищенный вход:</span>
                </div>
                <p>
                  Перейдите в почтовый ящик и кликните по ссылке из письма для активации аккаунта.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2">
              <a
                href={getMailProviderUrl(pendingVerification.user.email)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Открыть почтовый ящик ({pendingVerification.user.email.split('@')[1]})</span>
              </a>

              <div className="flex items-center justify-between pt-1 text-xs">
                <button
                  type="button"
                  onClick={handleCopyActivationLink}
                  className="text-slate-400 hover:text-white inline-flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'Ссылка скопирована' : 'Скопировать ссылку'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={isResending}
                  className="text-indigo-400 hover:underline font-medium inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  <span>{resendSuccess ? 'Письмо отправлено!' : 'Отправить повторно'}</span>
                </button>
              </div>
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
                  <span>Отправка письма...</span>
                </>
              ) : (
                <span>{isRegisterMode ? 'Зарегистрироваться и получить письмо' : 'Войти в кабинет'}</span>
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

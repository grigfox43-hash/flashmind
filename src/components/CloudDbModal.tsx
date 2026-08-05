import React, { useState } from 'react';
import { Database, X, Check, ExternalLink, RefreshCw, Server, AlertCircle } from 'lucide-react';
import { cloudDB, type CloudDBSettings } from '../db/cloudDatabase';

interface CloudDbModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCloudSyncSuccess: () => void;
}

export const CloudDbModal: React.FC<CloudDbModalProps> = ({
  isOpen,
  onClose,
  onCloudSyncSuccess,
}) => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    const isConnected = await cloudDB.testCloudConnection(url, key);
    setIsTesting(false);

    if (isConnected) {
      setTestResult({
        success: true,
        msg: 'Успешное подключение к облачной базе данных PostgreSQL / Supabase!',
      });
    } else {
      setTestResult({
        success: false,
        msg: 'Не удалось подключиться. Проверьте URL облачной БД и API ключ.',
      });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const settings: CloudDBSettings = {
      supabaseUrl: url.trim(),
      supabaseAnonKey: key.trim(),
      isEnabled: Boolean(url.trim() && key.trim()),
    };
    cloudDB.saveSettings(settings);
    onCloudSyncSuccess();
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl animate-fadeIn cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Облачная База Данных на хостинге</h3>
              <p className="text-xs text-slate-400">PostgreSQL / Supabase Cloud DB</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Для хранения всех карточек, колод и учеников централизованно в интернете на сервере подключите бесплатную облачную базу данных Supabase (PostgreSQL).
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">URL Облачной Базы Данных (Supabase URL)</label>
            <input
              type="text"
              placeholder="https://xyzcompany.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">API Ключ Облака (anon public key)</label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1Ni..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <a
            href="https://supabase.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:underline"
          >
            <span>Создать бесплатную облачную БД на Supabase.com (Free Tier)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {testResult.success ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{testResult.msg}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || !url.trim()}
              className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-slate-700 cursor-pointer disabled:opacity-50"
            >
              {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4 text-indigo-400" />}
              <span>Тест связи</span>
            </button>

            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Сохранить настройки БД</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

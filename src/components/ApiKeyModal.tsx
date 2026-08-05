import React, { useState } from 'react';
import { Key, X, Check, ExternalLink, HelpCircle, Zap, Bot } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
}) => {
  const [inputKey, setInputKey] = useState(apiKey);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveApiKey(inputKey.trim());
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer animate-backdrop-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl animate-modal-pop cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Google Gemini API Ключ</h3>
              <p className="text-xs text-slate-400">Настройка внешнего ИИ-генератора</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clear Explanation Box */}
        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-3">
          <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
            <HelpCircle className="w-4 h-4 text-amber-300" />
            <span>Зачем нужен API ключ?</span>
          </div>

          <div className="space-y-2 text-xs leading-relaxed text-slate-300">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Без API ключа (По умолчанию):</strong> Работает встроенный движок <em>Native High-Speed NLP</em>. Он на 100% бесплатен, работает мгновенно (0.05 сек) и не требует интернета.
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Bot className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">С API ключом (Google Gemini):</strong> Подключает мощную нейросеть Google для обработки сложных, неструктурированных художественных текстов и генерации подсказок.
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Ваш Gemini API Key</label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:underline"
          >
            <span>Бесплатно получить API ключ в Google AI Studio</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Сохранено!</span>
                </>
              ) : (
                <span>Сохранить ключ</span>
              )}
            </button>

            {apiKey && (
              <button
                type="button"
                onClick={() => {
                  setInputKey('');
                  onSaveApiKey('');
                }}
                className="px-4 py-3 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/20 font-semibold text-xs hover:bg-rose-500/20 cursor-pointer"
              >
                Удалить
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

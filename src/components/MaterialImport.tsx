import React, { useState } from 'react';
import {
  Upload,
  FileText,
  Sparkles,
  Bot,
  Layers,
  Check,
  AlertCircle,
  FileUp,
  Loader2,
} from 'lucide-react';
import type { Deck, Flashcard } from '../types/flashcard';
import { extractTextFromPDF } from '../utils/pdfParser';
import { generateNativeFlashcards, generateGeminiFlashcards } from '../services/aiGenerator';

interface MaterialImportProps {
  decks: Deck[];
  onCreateDeck: (title: string, category: string, color: string) => Deck;
  onAddCardsToDeck: (deckId: string, cards: Flashcard[]) => void;
  apiKey?: string;
  onOpenApiKeyModal: () => void;
  onSuccessNavigate: () => void;
}

const SAMPLE_TEXTS = [
  {
    title: 'Молекулярная генетика и ДНК',
    category: 'Биология',
    text: `Молекулярная генетика изучают структуру и функции генов на молекулярном уровне.
ДНК (дезоксирибонуклеиновая кислота) — это полимер, состоящий из нуклеотидов. Каждый нуклеотид содержит азотистое основание, дезоксирибозу и фосфатную группу.
Четыре типа азотистых оснований в ДНК: Аденин (A), Тимин (T), Гуанин (G) и Цитозин (C).
Правило Чаргаффа гласит: количество Аденина равно количеству Тимина (A=T), а количество Гуанина равно количеству Цитозина (G=C).
Репликация ДНК — это процесс самоудвоения молекулы ДНК перед делением клетки. Главным ферментом репликации является ДНК-полимераза.
Транскрипция — это синтез молекулы РНК на матрице ДНК. Фермент РНК-полимераза считывает информацию с гена.
Трансляция — это синтез белка на рибосоме на основе информации иРНК (информационной РНК).
Генетический код обладаёт свойством триплетности: одна аминокислота кодируется последовательностью из 3 нуклеотидов (кодоном).`,
  },
  {
    title: 'Основы Римского Права',
    category: 'Право',
    text: `Римское право — правовая система, сложившаяся в Древнем Риме и ставшая основой континентального права современных государств.
Источниками римского права являлись: Законы Двенадцати Таблиц, эдикты преторов, сенатусконсульты и труды юристов (Ульпиан, Гай, Папиниан).
Деление права на публичное (Jus publicum) и частное (Jus privatum) впервые сформулировал юрист Ульпиан. Публичное право охраняет интересы государства, частное — интересы отдельных лиц.
Вещное право делилось на владение (Possessio) и право собственности (Dominium / Proprietas).
Обязательственное право — правовые отношения, в силу которых одна сторона (должник) обязана совершить в пользу другой стороны (кредитора) определенное действие.
Договор (Contractus) — соглашение двух или более лиц, направленное на установление юридических обязательств.
Закон Юстиниана (Свод гражданского права / Corpus Juris Civilis) в VI веке н.э. систематизировал и кодифицировал все римское право.`,
  },
];

export const MaterialImport: React.FC<MaterialImportProps> = ({
  decks,
  onCreateDeck,
  onAddCardsToDeck,
  apiKey,
  onOpenApiKeyModal,
  onSuccessNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'pdf'>('text');
  const [inputText, setInputText] = useState('');
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  
  const [selectedDeckId, setSelectedDeckId] = useState<string>(decks[0]?.id || 'new');
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [newDeckCategory, setNewDeckCategory] = useState('Общее');
  const [cardCount, setCardCount] = useState<number>(8);
  const [useGemini, setUseGemini] = useState<boolean>(Boolean(apiKey));

  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // PDF File drop handler
  const handlePdfUpload = async (file: File) => {
    if (!file || file.type !== 'application/pdf') {
      setErrorMsg('Пожалуйста, выберите файл в формате PDF.');
      return;
    }

    setIsPdfLoading(true);
    setErrorMsg(null);
    setPdfFileName(file.name);

    try {
      const extractedText = await extractTextFromPDF(file);
      setInputText(extractedText);
      setSuccessMsg(`PDF файл «${file.name}» успешно прочитан (${extractedText.length} символов)!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка чтения PDF файла');
    } finally {
      setIsPdfLoading(false);
    }
  };

  const handleGenerateCards = async () => {
    if (!inputText.trim()) {
      setErrorMsg('Вставьте учебный текст или загрузите PDF документ.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      let targetDeckId = selectedDeckId;

      // If creating new deck
      if (selectedDeckId === 'new') {
        const title = newDeckTitle.trim() || 'Новый учебный материал';
        const created = onCreateDeck(title, newDeckCategory, 'from-indigo-500/20 to-purple-600/20 text-indigo-400 border-indigo-500/30');
        targetDeckId = created.id;
      }

      let generated: Flashcard[] = [];

      if (useGemini && apiKey) {
        generated = await generateGeminiFlashcards({
          text: inputText,
          deckId: targetDeckId,
          count: cardCount,
          apiKey,
        });
      } else {
        // Fallback to offline high-speed native NLP generator
        generated = generateNativeFlashcards(inputText, targetDeckId, cardCount);
      }

      if (generated.length === 0) {
        throw new Error('Не удалось извлечь карточки из этого текста. Попробуйте добавить более структурированный материал.');
      }

      onAddCardsToDeck(targetDeckId, generated);
      setSuccessMsg(`Успешно создано ${generated.length} карточек по системе интервального повторения!`);
      
      setTimeout(() => {
        onSuccessNavigate();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка генерации карточек.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          ИИ Генератор карточек
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Преврати учебный материал в флеш-карточки
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
          Загрузи конспект лекций, главу из учебника или PDF-файл. ИИ выделит ключевые определения, даты и концепции для интервального повторения.
        </p>
      </div>

      {/* Main Form Container */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6">
        {/* Source Tabs (PDF / Text) */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'text'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Текст / Конспект</span>
            </button>

            <button
              onClick={() => setActiveTab('pdf')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'pdf'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <FileUp className="w-4 h-4" />
              <span>PDF Документ</span>
            </button>
          </div>

          {/* Quick sample loader */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs text-slate-400">Примеры:</span>
            {SAMPLE_TEXTS.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputText(sample.text);
                  setNewDeckTitle(sample.title);
                  setNewDeckCategory(sample.category);
                  setSelectedDeckId('new');
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs text-indigo-300 hover:bg-slate-700 transition-colors"
              >
                {sample.title.split(' ')[0]} {sample.title.split(' ')[1]}
              </button>
            ))}
          </div>
        </div>

        {/* PDF File Upload Zone */}
        {activeTab === 'pdf' && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handlePdfUpload(e.dataTransfer.files[0]);
              }
            }}
            className="border-2 border-dashed border-slate-700 hover:border-indigo-500/50 rounded-2xl p-8 text-center bg-slate-900/50 transition-all cursor-pointer relative"
          >
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handlePdfUpload(e.target.files[0]);
                }
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            {isPdfLoading ? (
              <div className="flex flex-col items-center justify-center space-y-3 py-4">
                <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
                <p className="text-sm font-medium text-indigo-300">
                  Извлечение текста из PDF документа...
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-base font-semibold text-white">
                    {pdfFileName ? `Загружен: ${pdfFileName}` : 'Перетащите PDF файл сюда'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    или нажмите, чтобы выбрать файл с компьютера
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Textarea Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Содержимое учебного материала ({inputText.length} символов)</span>
            {inputText && (
              <button
                onClick={() => setInputText('')}
                className="text-slate-400 hover:text-rose-400 transition-colors"
              >
                Очистить
              </button>
            )}
          </label>
          <textarea
            rows={8}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Вставьте конспект лекции, главу из книги или выдержку из статьи..."
            className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
          />
        </div>

        {/* Configuration Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-800">
          {/* Deck Selection */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Целевая колода</span>
            </label>

            <select
              value={selectedDeckId}
              onChange={(e) => setSelectedDeckId(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="new">+ Создать новую колоду</option>
              {decks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.title} ({deck.cards.length} карт)
                </option>
              ))}
            </select>

            {selectedDeckId === 'new' && (
              <div className="space-y-2 pt-1 animate-fadeIn">
                <input
                  type="text"
                  placeholder="Название новой колоды (например: Квантовая физика)"
                  value={newDeckTitle}
                  onChange={(e) => setNewDeckTitle(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Категория (например: Физика)"
                  value={newDeckCategory}
                  onChange={(e) => setNewDeckCategory(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          {/* AI Settings & Card Count */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-400" />
              <span>Настройки ИИ</span>
            </label>

            <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-300">Количество карточек:</span>
              <div className="flex items-center gap-2">
                {[5, 8, 12, 15].map((cnt) => (
                  <button
                    key={cnt}
                    onClick={() => setCardCount(cnt)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      cardCount === cnt
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>

            {/* Model switch */}
            <div className="flex flex-col gap-2 bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200 block">
                    {useGemini && apiKey ? 'Google Gemini 1.5 Flash' : 'Native High-Speed NLP (Офлайн ИИ)'}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    {useGemini && apiKey
                      ? 'Глубокая LLM генерация с перефразированием'
                      : 'Мгновенное извлечение терминов без интервала и ключей'}
                  </span>
                </div>

                {apiKey ? (
                  <button
                    onClick={() => setUseGemini(!useGemini)}
                    className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all cursor-pointer ${
                      useGemini
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {useGemini ? 'Gemini Вкл' : 'Использовать Gemini'}
                  </button>
                ) : (
                  <button
                    onClick={onOpenApiKeyModal}
                    className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20 font-medium text-[11px] cursor-pointer"
                  >
                    + API Ключ
                  </button>
                )}
              </div>

              {/* Explanatory Note */}
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/60 leading-relaxed">
                💡 <strong className="text-slate-300">Подсказка:</strong> По умолчанию карточки создаются мгновенно и бесплатно через встроенный <em>Native NLP</em>. Подключать API-ключ Google Gemini нужно только если требуется ИИ-перефразирование сложного текста.
              </div>
            </div>
          </div>
        </div>

        {/* Error / Success Messages */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center gap-3">
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleGenerateCards}
          disabled={isGenerating || !inputText.trim()}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold text-base shadow-xl shadow-indigo-600/30 hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>ИИ анализирует материал и генерирует карточки...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>Сгенерировать {cardCount} карточек</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

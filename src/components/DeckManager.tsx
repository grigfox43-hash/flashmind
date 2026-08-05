import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Download,
  Upload,
  Search,
  X,
} from 'lucide-react';
import type { Deck } from '../types/flashcard';

interface DeckManagerProps {
  decks: Deck[];
  onCreateDeck: (title: string, category: string, color: string) => Deck;
  onDeleteDeck: (deckId: string) => void;
  onAddManualCard: (deckId: string, card: { question: string; answer: string; hint?: string; topicTag: string }) => void;
  onDeleteCard: (deckId: string, cardId: string) => void;
  onImportDecks: (imported: Deck[]) => void;
}

export const DeckManager: React.FC<DeckManagerProps> = ({
  decks,
  onCreateDeck,
  onDeleteDeck,
  onAddManualCard,
  onDeleteCard,
  onImportDecks,
}) => {
  const [selectedDeckId, setSelectedDeckId] = useState<string>(decks[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  
  // New Deck Modal/Inline state
  const [showNewDeckForm, setShowNewDeckForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');

  // Manual Card Form state
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [cardQ, setCardQ] = useState('');
  const [cardA, setCardA] = useState('');
  const [cardHint, setCardHint] = useState('');
  const [cardTag, setCardTag] = useState('');

  const currentDeck = decks.find((d) => d.id === selectedDeckId) || decks[0];

  const handleCreateDeckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created = onCreateDeck(
      newTitle.trim(),
      newCategory.trim() || 'Общее',
      'from-indigo-500/20 to-purple-600/20 text-indigo-400 border-indigo-500/30'
    );
    setSelectedDeckId(created.id);
    setNewTitle('');
    setNewCategory('');
    setShowNewDeckForm(false);
  };

  const handleAddCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardQ.trim() || !cardA.trim() || !currentDeck) return;

    onAddManualCard(currentDeck.id, {
      question: cardQ.trim(),
      answer: cardA.trim(),
      hint: cardHint.trim() || undefined,
      topicTag: cardTag.trim() || 'Общая тема',
    });

    setCardQ('');
    setCardA('');
    setCardHint('');
    setCardTag('');
    setShowAddCardModal(false);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(decks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `flashmind_decks_export.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportDecks(parsed);
        }
      } catch (err) {
        alert('Неверный формат JSON файла.');
      }
    };
    reader.readAsText(file);
  };

  const filteredCards = (currentDeck?.cards || []).filter(
    (c) =>
      c.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.topicTag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 animate-fadeIn">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Управление Колодами и Карточками</h1>
          <p className="text-slate-400 text-sm mt-1">
            Просматривайте, редактируйте и добавляйте карточки вручную или экспортируйте данные в JSON.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportJSON}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all flex items-center gap-2 border border-slate-700"
          >
            <Download className="w-4 h-4" />
            <span>Экспорт JSON</span>
          </button>

          <label className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all flex items-center gap-2 border border-slate-700 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Импорт JSON</span>
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          <button
            onClick={() => setShowNewDeckForm(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Новая колода</span>
          </button>
        </div>
      </div>

      {/* New Deck Form Modal */}
      {showNewDeckForm && (
        <div className="p-6 rounded-2xl glass-panel border border-indigo-500/40 animate-fadeIn">
          <form onSubmit={handleCreateDeckSubmit} className="space-y-4">
            <h3 className="text-lg font-bold text-white">Создать новую колоду</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                required
                placeholder="Название колоды (напр.: Анатомия)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                placeholder="Категория (напр.: Медицина)"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500"
              >
                Создать
              </button>
              <button
                type="button"
                onClick={() => setShowNewDeckForm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 font-semibold text-xs hover:bg-slate-700"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Two-column Deck & Card manager */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Deck List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Все колоды</h3>

          <div className="space-y-2">
            {decks.map((deck) => (
              <div
                key={deck.id}
                onClick={() => setSelectedDeckId(deck.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedDeckId === deck.id
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold text-sm text-slate-200">{deck.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {deck.cards.length} карточек • {deck.category}
                  </div>
                </div>

                {decks.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Удалить колоду «${deck.title}»?`)) {
                        onDeleteDeck(deck.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Cards in Selected Deck */}
        <div className="lg:col-span-3 space-y-6">
          {currentDeck ? (
            <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
              {/* Deck Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
                      {currentDeck.category}
                    </span>
                    <span className="text-xs text-slate-400">
                      {currentDeck.cards.length} карточек всего
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mt-1">{currentDeck.title}</h2>
                </div>

                <button
                  onClick={() => setShowAddCardModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-md shadow-indigo-600/30"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добавить карточку вручную</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Поиск карточек по вопросу, ответу или тегу..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Cards List */}
              <div className="space-y-3">
                {filteredCards.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    Карточки не найдены.
                  </div>
                ) : (
                  filteredCards.map((card) => (
                    <div
                      key={card.id}
                      className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 hover:border-slate-700 transition-all relative group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-indigo-300 text-[11px] font-semibold border border-slate-700">
                            {card.topicTag}
                          </span>
                          <h4 className="text-base font-bold text-white pt-1">{card.question}</h4>
                        </div>

                        <button
                          onClick={() => onDeleteCard(currentDeck.id, card.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100"
                          title="Удалить карточку"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/60 text-sm text-slate-300 border border-slate-800/80">
                        {card.answer}
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                        <span>Интервал: {card.interval} дн.</span>
                        <span>Повторений: {card.repetition}</span>
                        <span>Срок: {card.dueDate}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400">Выберите колоду слева</div>
          )}
        </div>
      </div>

      {/* Manual Card Modal */}
      {showAddCardModal && (
        <div
          onClick={() => setShowAddCardModal(false)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Добавить карточку вручную</h3>
              <button
                onClick={() => setShowAddCardModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCardSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Вопрос</label>
                <textarea
                  required
                  rows={2}
                  value={cardQ}
                  onChange={(e) => setCardQ(e.target.value)}
                  placeholder="В чём заключается..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Ответ</label>
                <textarea
                  required
                  rows={3}
                  value={cardA}
                  onChange={(e) => setCardA(e.target.value)}
                  placeholder="Правильный ответ..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Подсказка</label>
                  <input
                    type="text"
                    value={cardHint}
                    onChange={(e) => setCardHint(e.target.value)}
                    placeholder="Подсказка..."
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Тег темы</label>
                  <input
                    type="text"
                    value={cardTag}
                    onChange={(e) => setCardTag(e.target.value)}
                    placeholder="напр. Революция"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-500 transition-all shadow-lg"
              >
                Сохранить карточку
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

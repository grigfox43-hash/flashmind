import React, { useState, useEffect, useCallback } from 'react';
import {
  RotateCw,
  Volume2,
  HelpCircle,
  CheckCircle2,
  Award,
  ArrowRight,
  Tag,
  Calendar,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Deck, Flashcard, ReviewRating } from '../types/flashcard';
import { calculateSM2, isCardDueToday, formatDueDateLabel } from '../utils/srs';

interface FlashcardReviewProps {
  decks: Deck[];
  onReviewCard: (
    deckId: string,
    cardId: string,
    rating: ReviewRating,
    newSM2: { interval: number; repetition: number; easeFactor: number; dueDate: string }
  ) => void;
  onFinishSession: () => void;
}

export const FlashcardReview: React.FC<FlashcardReviewProps> = ({
  decks,
  onReviewCard,
  onFinishSession,
}) => {
  const [selectedDeckId, setSelectedDeckId] = useState<string>('all');
  const [queue, setQueue] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // Initialize review queue
  useEffect(() => {
    let cardsToReview: Flashcard[] = [];

    if (selectedDeckId === 'all') {
      cardsToReview = decks.flatMap((d) => d.cards).filter((c) => isCardDueToday(c));
      // If no cards are due today, load all cards for extra practice
      if (cardsToReview.length === 0) {
        cardsToReview = decks.flatMap((d) => d.cards);
      }
    } else {
      const targetDeck = decks.find((d) => d.id === selectedDeckId);
      if (targetDeck) {
        cardsToReview = targetDeck.cards.filter((c) => isCardDueToday(c));
        if (cardsToReview.length === 0) {
          cardsToReview = targetDeck.cards;
        }
      }
    }

    setQueue(cardsToReview);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setSessionCompleted(false);
  }, [selectedDeckId, decks]);

  const currentCard = queue[currentIndex];

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleRateCard = useCallback(
    (rating: ReviewRating) => {
      if (!currentCard) return;

      const newSM2 = calculateSM2(currentCard, rating);
      onReviewCard(currentCard.deckId, currentCard.id, rating, newSM2);

      // Move to next card
      if (currentIndex + 1 < queue.length) {
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
        setShowHint(false);
      } else {
        setSessionCompleted(true);
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (e) {
          // ignore if confetti fails
        }
      }
    },
    [currentCard, currentIndex, queue.length, onReviewCard]
  );

  // Text-to-Speech audio reader
  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ru-RU';
      window.speechSynthesis.speak(utterance);
    }
  };

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (sessionCompleted || !currentCard) return;

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleFlip();
      } else if (isFlipped) {
        if (e.key === '1') handleRateCard(1);
        if (e.key === '2') handleRateCard(2);
        if (e.key === '3') handleRateCard(3);
        if (e.key === '4') handleRateCard(4);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleRateCard, isFlipped, sessionCompleted, currentCard]);

  if (queue.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-white">Все карточки повторены!</h2>
        <p className="text-slate-400 text-sm">
          На сегодня не осталось карточек для повторения по алгоритму SM-2. Отличная работа!
        </p>
        <button
          onClick={onFinishSession}
          className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold shadow-lg hover:bg-indigo-500 transition-all"
        >
          Вернуться на Дашборд
        </button>
      </div>
    );
  }

  if (sessionCompleted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30">
          <Award className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-extrabold text-white">Сессия повторения завершена!</h2>
        <p className="text-slate-400 text-sm">
          Вы успешно повторили {queue.length} карточек. Все интервалы и уровни усвоения обновлены в системе SM-2.
        </p>

        <div className="flex justify-center gap-4 pt-4">
          <button
            onClick={() => {
              setSessionCompleted(false);
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-200 font-semibold hover:bg-slate-700 transition-all flex items-center gap-2"
          >
            <RotateCw className="w-4 h-4" />
            <span>Повторить еще раз</span>
          </button>

          <button
            onClick={onFinishSession}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-all flex items-center gap-2"
          >
            <span>Перейти к Дашборду</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / queue.length) * 100);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Top Filter & Progress */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Deck Selector */}
        <div className="w-full sm:w-auto">
          <select
            value={selectedDeckId}
            onChange={(e) => setSelectedDeckId(e.target.value)}
            className="w-full sm:w-64 rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Все колоды ({decks.flatMap((d) => d.cards).length} карт)</option>
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.title} ({deck.cards.length} карт)
              </option>
            ))}
          </select>
        </div>

        {/* Counter & Progress bar */}
        <div className="w-full sm:w-72 space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-400">
            <span>Карточка {currentIndex + 1} из {queue.length}</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Flashcard 3D Card Container */}
      <div className="perspective-1000 min-h-[380px] w-full">
        <div
          onClick={handleFlip}
          className={`w-full min-h-[380px] rounded-3xl cursor-pointer transform-style-3d transition-transform duration-500 shadow-2xl ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* Front Side */}
          <div className="absolute inset-0 w-full h-full rounded-3xl glass-panel border border-slate-700/60 p-8 flex flex-col justify-between backface-hidden">
            {/* Card Header info */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20 flex items-center gap-1.5">
                  <Tag className="w-3 h-3" />
                  {currentCard.topicTag || 'Тема'}
                </span>
                <span className="text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDueDateLabel(currentCard.dueDate)}
                </span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpeak(currentCard.question);
                }}
                className="p-2 rounded-lg bg-slate-800/60 text-slate-400 hover:text-indigo-400 transition-colors"
                title="Озвучить вопрос"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            {/* Question Text */}
            <div className="my-auto text-center space-y-4 px-2 sm:px-6">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">ВОПРОС</p>
              <h3 className="text-xl sm:text-2xl font-bold text-white leading-relaxed">
                {currentCard.question}
              </h3>

              {currentCard.hint && (
                <div className="pt-2">
                  {showHint ? (
                    <div className="inline-block p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs animate-fadeIn">
                      💡 {currentCard.hint}
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowHint(true);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Показать подсказку</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Click to flip prompt */}
            <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <RotateCw className="w-3.5 h-3.5 text-indigo-400 animate-spin-slow" />
              <span>Нажмите или нажмите [Пробел], чтобы перевернуть</span>
            </div>
          </div>

          {/* Back Side (Answer & Ratings) */}
          <div className="absolute inset-0 w-full h-full rounded-3xl glass-panel border border-indigo-500/40 p-8 flex flex-col justify-between rotate-y-180 backface-hidden bg-slate-900/90">
            {/* Header */}
            <div className="flex items-center justify-between text-xs">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                ОТВЕТ И ПОЯСНЕНИЕ
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpeak(currentCard.answer);
                }}
                className="p-2 rounded-lg bg-slate-800/60 text-slate-400 hover:text-emerald-400 transition-colors"
                title="Озвучить ответ"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            {/* Answer Content */}
            <div className="my-auto text-center space-y-3 px-2 sm:px-6">
              <p className="text-lg sm:text-xl font-semibold text-emerald-200 leading-relaxed">
                {currentCard.answer}
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-slate-400 pt-2">
                <span>Интервал: {currentCard.interval} дн.</span>
                <span>Множитель (EF): {currentCard.easeFactor}</span>
              </div>
            </div>

            {/* Rating Buttons Prompt */}
            <div className="text-center text-xs text-slate-400 pb-1">
              Оцените сложность ответа (Клавиши [1] - [4]):
            </div>
          </div>
        </div>
      </div>

      {/* SRS Rating Buttons (Visible when card is flipped) */}
      {isFlipped && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fadeIn">
          <button
            onClick={() => handleRateCard(1)}
            className="p-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition-colors text-center space-y-1 cursor-pointer"
          >
            <div className="font-bold text-sm">
              1. Не помню
            </div>
            <div className="text-[11px] text-rose-400/80">Повторить (1 дн)</div>
          </button>

          <button
            onClick={() => handleRateCard(2)}
            className="p-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-colors text-center space-y-1 cursor-pointer"
          >
            <div className="font-bold text-sm">
              2. Трудно
            </div>
            <div className="text-[11px] text-amber-400/80">Интервал x1.2</div>
          </button>

          <button
            onClick={() => handleRateCard(3)}
            className="p-3.5 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 transition-colors text-center space-y-1 cursor-pointer"
          >
            <div className="font-bold text-sm">
              3. Хорошо
            </div>
            <div className="text-[11px] text-indigo-400/80">По расписанию</div>
          </button>

          <button
            onClick={() => handleRateCard(4)}
            className="p-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 transition-colors text-center space-y-1 cursor-pointer"
          >
            <div className="font-bold text-sm">
              4. Легко!
            </div>
            <div className="text-[11px] text-emerald-400/80">Увеличить срок</div>
          </button>
        </div>
      )}
    </div>
  );
};

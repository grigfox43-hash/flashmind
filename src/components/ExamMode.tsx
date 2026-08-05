import React, { useState } from 'react';
import {
  GraduationCap,
  CheckCircle2,
  Award,
  RotateCw,
  BarChart2,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Deck, Flashcard, ExamQuestion, ExamResult } from '../types/flashcard';

interface ExamModeProps {
  decks: Deck[];
  onCompleteExam: (result: ExamResult) => void;
  onFinishExamView: () => void;
}

export const ExamMode: React.FC<ExamModeProps> = ({
  decks,
  onCompleteExam,
  onFinishExamView,
}) => {
  const [selectedDeckId, setSelectedDeckId] = useState<string>(decks[0]?.id || 'all');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [isExamActive, setIsExamActive] = useState(false);
  
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [selectedOption, setSelectedOption] = useState<string>('');
  
  const [isFinished, setIsFinished] = useState(false);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);

  // Generate Questions for Practice Exam
  const startExam = () => {
    let pool: Flashcard[] = [];
    if (selectedDeckId === 'all') {
      pool = decks.flatMap((d) => d.cards);
    } else {
      const target = decks.find((d) => d.id === selectedDeckId);
      if (target) pool = target.cards;
    }

    if (pool.length === 0) return;

    // Shuffle pool
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, questionCount);
    const allAnswers = pool.map((c) => c.answer);

    const generatedQuestions: ExamQuestion[] = shuffled.map((card, idx) => {
      // Build 4 multiple choice options
      const distractors = allAnswers
        .filter((a) => a !== card.answer)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      
      const options = [card.answer, ...distractors].sort(() => Math.random() - 0.5);

      return {
        id: `eq-${idx}-${card.id}`,
        cardId: card.id,
        question: card.question,
        correctAnswer: card.answer,
        options: options.length >= 2 ? options : undefined,
        type: options.length >= 2 ? 'multiple-choice' : 'written',
        topicTag: card.topicTag || 'Общая тема',
      };
    });

    setQuestions(generatedQuestions);
    setCurrentIndex(0);
    setUserAnswers({});
    setSelectedOption('');
    setIsFinished(false);
    setExamResult(null);
    setIsExamActive(true);
  };

  const handleNextQuestion = () => {
    const q = questions[currentIndex];
    const answerToSave = selectedOption || userAnswers[q.id] || '';
    
    const updatedAnswers = { ...userAnswers, [q.id]: answerToSave };
    setUserAnswers(updatedAnswers);
    setSelectedOption('');

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Finish Exam & calculate score
      finishExam(updatedAnswers);
    }
  };

  const finishExam = (answers: Record<string, string>) => {
    let correct = 0;
    const topicBreakdown: Record<string, { total: number; correct: number }> = {};

    questions.forEach((q) => {
      const userAns = (answers[q.id] || '').trim().toLowerCase();
      const correctAns = q.correctAnswer.trim().toLowerCase();
      
      let isCorrect = false;
      if (q.type === 'multiple-choice') {
        isCorrect = userAns === correctAns;
      } else {
        // Simple fuzzy match for written responses
        isCorrect = userAns.length > 0 && (correctAns.includes(userAns) || userAns.includes(correctAns));
      }

      if (isCorrect) correct++;

      const tag = q.topicTag;
      if (!topicBreakdown[tag]) {
        topicBreakdown[tag] = { total: 0, correct: 0 };
      }
      topicBreakdown[tag].total += 1;
      if (isCorrect) topicBreakdown[tag].correct += 1;
    });

    const scorePercentage = Math.round((correct / questions.length) * 100);
    const targetDeckName = decks.find((d) => d.id === selectedDeckId)?.title || 'Все темы';

    const result: ExamResult = {
      date: new Date().toISOString(),
      deckId: selectedDeckId,
      deckTitle: targetDeckName,
      totalQuestions: questions.length,
      correctCount: correct,
      scorePercentage,
      topicBreakdown,
    };

    setExamResult(result);
    setIsFinished(true);
    onCompleteExam(result);

    if (scorePercentage >= 80) {
      try {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      } catch (e) {
        // ignore
      }
    }
  };

  if (!isExamActive) {
    const totalAvailableCards =
      selectedDeckId === 'all'
        ? decks.flatMap((d) => d.cards).length
        : decks.find((d) => d.id === selectedDeckId)?.cards.length || 0;

    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <GraduationCap className="w-3.5 h-3.5" />
            Симулятор Экзамена
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            Проверь готовность к экзамену
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            ИИ сгенерирует тест с несколькими вариантами ответов на основе ваших карточек для проверки знаний перед реальным экзаменом.
          </p>
        </div>

        {/* Configuration Card */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="space-y-4">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Выберите предмета или колоду для симуляции
            </label>
            <select
              value={selectedDeckId}
              onChange={(e) => setSelectedDeckId(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Все предметы ({decks.flatMap((d) => d.cards).length} карт)</option>
              {decks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.title} ({deck.cards.length} карточек)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Количество вопросов в тесте
            </label>
            <div className="grid grid-cols-4 gap-3">
              {[5, 10, 15, 20].map((count) => (
                <button
                  key={count}
                  onClick={() => setQuestionCount(count)}
                  disabled={count > totalAvailableCards && totalAvailableCards > 0}
                  className={`py-3 rounded-xl font-bold text-sm transition-all ${
                    questionCount === count
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 disabled:opacity-30'
                  }`}
                >
                  {count} вопр.
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startExam}
            disabled={totalAvailableCards === 0}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold text-base shadow-xl hover:opacity-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <GraduationCap className="w-5 h-5" />
            <span>Начать симуляцию экзамена</span>
          </button>
        </div>
      </div>
    );
  }

  if (isFinished && examResult) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
        <div className="glass-panel rounded-3xl p-8 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Award className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-3xl font-extrabold text-white">Результат Тестирования</h2>
            <p className="text-slate-400 text-sm mt-1">{examResult.deckTitle}</p>
          </div>

          {/* Big Score Gauge */}
          <div className="py-4">
            <div className="text-6xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {examResult.scorePercentage}%
            </div>
            <p className="text-sm font-semibold text-slate-300 mt-2">
              Правильно отвечено {examResult.correctCount} из {examResult.totalQuestions} вопросов
            </p>
          </div>

          {/* Diagnostic Breakdown per Topic */}
          <div className="space-y-3 text-left border-t border-slate-800 pt-6">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-400" />
              <span>Разбор знаний по темам:</span>
            </h4>

            <div className="space-y-2">
              {Object.entries(examResult.topicBreakdown).map(([tag, data]) => {
                const topicScore = Math.round((data.correct / data.total) * 100);
                return (
                  <div key={tag} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-slate-200 block">{tag}</span>
                      <span className="text-xs text-slate-400">
                        {data.correct} из {data.total} правильно
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-bold ${
                          topicScore >= 80
                            ? 'text-emerald-400'
                            : topicScore >= 50
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {topicScore}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={startExam}
              className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-200 font-semibold hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <RotateCw className="w-4 h-4" />
              <span>Пройти еще раз</span>
            </button>

            <button
              onClick={() => {
                setIsExamActive(false);
                onFinishExamView();
              }}
              className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-all flex items-center justify-center gap-2"
            >
              <span>Дашборд готовности</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
        <span>Вопрос {currentIndex + 1} из {questions.length}</span>
        <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-indigo-400">
          Тема: {currentQ.topicTag}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6">
        <h3 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
          {currentQ.question}
        </h3>

        {/* Multiple Choice Options */}
        {currentQ.type === 'multiple-choice' && currentQ.options ? (
          <div className="space-y-3">
            {currentQ.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedOption(opt)}
                className={`w-full p-4 rounded-xl border text-left text-sm transition-all flex items-center justify-between ${
                  selectedOption === opt
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span>{opt}</span>
                {selectedOption === opt && <CheckCircle2 className="w-5 h-5 text-indigo-400" />}
              </button>
            ))}
          </div>
        ) : (
          /* Written answer input */
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400">Напишите ваш ответ:</label>
            <textarea
              rows={3}
              value={userAnswers[currentQ.id] || ''}
              onChange={(e) => setUserAnswers({ ...userAnswers, [currentQ.id]: e.target.value })}
              placeholder="Введите ответ..."
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        <button
          onClick={handleNextQuestion}
          disabled={!selectedOption && !(userAnswers[currentQ.id] && userAnswers[currentQ.id].trim())}
          className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-lg hover:bg-indigo-500 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <span>{currentIndex + 1 === questions.length ? 'Завершить тест' : 'Следующий вопрос'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

import type { Deck, Flashcard, WeakTopic } from '../types/flashcard';
import { getCardStatus, isCardDueToday } from './srs';

export interface ExamReadinessOverview {
  overallScore: number; // 0 - 100%
  masteryRate: number; // 0 - 100%
  retentionRate: number; // 0 - 100%
  dueTodayCount: number;
  totalCardsCount: number;
  masteredCount: number;
  learningCount: number;
  newCount: number;
  weakTopics: WeakTopic[];
  readinessLabel: string;
  readinessColor: string;
}

export function calculateExamReadiness(decks: Deck[]): ExamReadinessOverview {
  const allCards: Flashcard[] = decks.flatMap((d) => d.cards);
  
  if (allCards.length === 0) {
    return {
      overallScore: 0,
      masteryRate: 0,
      retentionRate: 0,
      dueTodayCount: 0,
      totalCardsCount: 0,
      masteredCount: 0,
      learningCount: 0,
      newCount: 0,
      weakTopics: [],
      readinessLabel: 'Нет данных',
      readinessColor: 'text-slate-400',
    };
  }

  let masteredCount = 0;
  let learningCount = 0;
  let newCount = 0;
  let dueTodayCount = 0;

  let totalSuccesses = 0;
  let totalFails = 0;

  const topicMap: Record<string, { total: number; fails: number; successes: number }> = {};

  allCards.forEach((card) => {
    const status = getCardStatus(card);
    if (status === 'mastered') masteredCount++;
    else if (status === 'learning' || status === 'review') learningCount++;
    else newCount++;

    if (isCardDueToday(card)) dueTodayCount++;

    totalSuccesses += card.successCount || 0;
    totalFails += card.failCount || 0;

    const topic = card.topicTag || 'Общие темы';
    if (!topicMap[topic]) {
      topicMap[topic] = { total: 0, fails: 0, successes: 0 };
    }
    topicMap[topic].total += 1;
    topicMap[topic].fails += card.failCount || 0;
    topicMap[topic].successes += card.successCount || 0;
  });

  const totalCards = allCards.length;
  const masteryRate = Math.round((masteredCount / totalCards) * 100);
  
  const totalReviews = totalSuccesses + totalFails;
  const retentionRate = totalReviews > 0 ? Math.round((totalSuccesses / totalReviews) * 100) : 50;

  const cardWeightScore = (masteredCount * 1.0 + learningCount * 0.55 + newCount * 0.1) / totalCards;
  const overduePenalty = Math.max(0, 1 - dueTodayCount / totalCards);

  const rawScore = cardWeightScore * 50 + (retentionRate / 100) * 35 + overduePenalty * 15;
  const overallScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  // Weak topics calculation
  const weakTopics: WeakTopic[] = Object.entries(topicMap)
    .map(([topicTag, data]) => {
      const topicTotalReviews = data.successes + data.fails;
      const accuracy = topicTotalReviews > 0 ? Math.round((data.successes / topicTotalReviews) * 100) : 0;
      
      let urgency: 'high' | 'medium' | 'low' = 'low';
      if (accuracy < 60 || data.fails >= 3) urgency = 'high';
      else if (accuracy < 80 || data.fails >= 1) urgency = 'medium';

      return {
        topicTag,
        totalCards: data.total,
        failCount: data.fails,
        successCount: data.successes,
        accuracy,
        urgency,
      };
    })
    .filter((t) => t.urgency !== 'low' || t.failCount > 0)
    .sort((a, b) => {
      if (a.urgency === 'high' && b.urgency !== 'high') return -1;
      if (b.urgency === 'high' && a.urgency !== 'high') return 1;
      return a.accuracy - b.accuracy;
    });

  let readinessLabel = 'Низкая готовность';
  let readinessColor = 'text-rose-400';

  if (overallScore >= 85) {
    readinessLabel = 'Отличная готовность к экзамену!';
    readinessColor = 'text-emerald-400';
  } else if (overallScore >= 65) {
    readinessLabel = 'Хорошая готовность';
    readinessColor = 'text-indigo-400';
  } else if (overallScore >= 45) {
    readinessLabel = 'Умеренная готовность';
    readinessColor = 'text-amber-400';
  }

  return {
    overallScore,
    masteryRate,
    retentionRate,
    dueTodayCount,
    totalCardsCount: totalCards,
    masteredCount,
    learningCount,
    newCount,
    weakTopics,
    readinessLabel,
    readinessColor,
  };
}

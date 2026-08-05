import type { Flashcard, ReviewRating, CardStatus } from '../types/flashcard';

export function calculateSM2(
  card: Flashcard,
  rating: ReviewRating
): {
  interval: number;
  repetition: number;
  easeFactor: number;
  dueDate: string;
} {
  // Map rating (1..4) to SuperMemo quality (1, 3, 4, 5)
  // 1: Again -> 1 (Fail)
  // 2: Hard -> 3 (Pass with difficulty)
  // 3: Good -> 4 (Good pass)
  // 4: Easy -> 5 (Perfect recall)
  const qualityMap: Record<ReviewRating, number> = {
    1: 1,
    2: 3,
    3: 4,
    4: 5,
  };

  const q = qualityMap[rating];
  let easeFactor = card.easeFactor || 2.5;
  let repetition = card.repetition || 0;
  let interval = card.interval || 0;

  // Calculate new Ease Factor (EF)
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  if (q < 3) {
    // Failed recall
    repetition = 0;
    interval = 1;
  } else {
    // Successful recall
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetition += 1;
  }

  // Calculate next due date
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);
  const dueDate = nextDate.toISOString().split('T')[0];

  return {
    interval,
    repetition,
    easeFactor: Number(easeFactor.toFixed(2)),
    dueDate,
  };
}

export function getCardStatus(card: Flashcard): CardStatus {
  if (card.repetition >= 4 || card.interval >= 21) return 'mastered';
  if (card.interval >= 6) return 'review';
  if (card.repetition > 0) return 'learning';
  return 'new';
}

export function isCardDueToday(card: Flashcard): boolean {
  if (!card.dueDate) return true;
  const today = new Date().toISOString().split('T')[0];
  return card.dueDate <= today;
}

export function formatDueDateLabel(dueDate: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Сегодня';
  if (diffDays === 1) return 'Завтра';
  return `Через ${diffDays} дн.`;
}

import type { Flashcard } from '../types/flashcard';

export interface GenerateOptions {
  text: string;
  deckId: string;
  count?: number;
  apiKey?: string;
  language?: 'ru' | 'en' | 'auto';
}

/**
 * Heuristic Native NLP Flashcard Generator
 * Parses key terms, definitions, headings, lists, and cloze deletions offline.
 */
export function generateNativeFlashcards(text: string, deckId: string, count: number = 8): Flashcard[] {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  
  let currentTopic = 'Главная тема';
  const rawPairs: { q: string; a: string; hint?: string; tag: string }[] = [];

  // Patterns for definitions (Russian & English)
  const defRegex = /^(?:[\d\.\-\*\•]\s*)?([A-ZА-Я0-9\s\-\–\—]{2,45})\s*(?:—|–|-|это|представляет собой|означает|is|are|refers to|defined as)\s+(.+)$/i;
  
  // Clean text lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect section headers
    if (line.length < 50 && (line.startsWith('#') || line.endsWith(':') || line.toUpperCase() === line || line.match(/^(Глава|Тема|Раздел|Chapter|Topic)\s+\d+/i))) {
      currentTopic = line.replace(/^[#\d\.\-\*:]+\s*/, '').trim();
      continue;
    }

    // Try definition pattern match
    const defMatch = line.match(defRegex);
    if (defMatch && defMatch[1] && defMatch[2] && defMatch[2].length > 10) {
      const term = defMatch[1].trim();
      const definition = defMatch[2].trim();
      
      rawPairs.push({
        q: `Что такое «${term}»?`,
        a: definition,
        hint: `Категория: ${currentTopic}`,
        tag: currentTopic,
      });
      continue;
    }

    // Question mark pattern
    if (line.includes('?') && line.length < 120 && i + 1 < lines.length) {
      const question = line.replace(/^[\d\.\-\*\•]\s*/, '').trim();
      const answer = lines[i + 1].replace(/^[\d\.\-\*\•]\s*/, '').trim();
      if (answer.length > 5 && !answer.includes('?')) {
        rawPairs.push({
          q: question,
          a: answer,
          hint: `Тема: ${currentTopic}`,
          tag: currentTopic,
        });
        i++; // skip next line as it was used as answer
        continue;
      }
    }

    // Cloze deletion generator for important facts with dates or numbers
    if (line.match(/\b(17\d\d|18\d\d|19\d\d|20\d\d)\b/) || line.match(/\b\d+\s*%/)) {
      const yearMatch = line.match(/\b(17\d\d|18\d\d|19\d\d|20\d\d)\b/);
      if (yearMatch && line.length > 25) {
        const year = yearMatch[1];
        const clozeQ = line.replace(year, '____');
        rawPairs.push({
          q: `Заполните пропуск (год): "${clozeQ}"`,
          a: year,
          hint: `Укажите точный год событиия (${currentTopic})`,
          tag: currentTopic,
        });
      }
    }
  }

  // Fallback chunking if not enough structure was detected
  if (rawPairs.length < count) {
    const paragraphs = text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 40);

    for (let j = 0; j < paragraphs.length && rawPairs.length < count * 2; j++) {
      const para = paragraphs[j];
      const sentences = para.split(/(?<=[.!?])\s+/).filter((s) => s.length > 15);
      
      if (sentences.length >= 2) {
        const keyFact = sentences[0];
        
        const firstWords = keyFact.split(' ').slice(0, 4).join(' ');
        rawPairs.push({
          q: `Ключевое положение по теме "${currentTopic}": О чем говорится в контексте "${firstWords}..."?`,
          a: para,
          hint: keyFact,
          tag: currentTopic,
        });
      }
    }
  }

  // Deduplicate and limit to requested count
  const today = new Date().toISOString().split('T')[0];
  const selected = rawPairs.slice(0, count);

  return selected.map((pair, idx) => ({
    id: `card-${Date.now()}-${idx}`,
    deckId,
    question: pair.q,
    answer: pair.a,
    hint: pair.hint,
    topicTag: pair.tag || 'Учебный материал',
    interval: 0,
    repetition: 0,
    easeFactor: 2.5,
    dueDate: today,
    reviewHistory: [],
    failCount: 0,
    successCount: 0,
  }));
}

/**
 * AI Generation via Google Gemini REST API
 */
export async function generateGeminiFlashcards(options: GenerateOptions): Promise<Flashcard[]> {
  const { text, deckId, count = 10, apiKey } = options;

  if (!apiKey) {
    throw new Error('API ключ Gemini не указан');
  }

  const prompt = `Ты — экспертный преподаватель и создатель учебных карточек по системе интервального повторения.
Из следующего учебного материала выдели основные концепции, термины, определения и даты.
Создай ровно ${count} качественных, понятных и емких флеш-карточек в формате JSON массива.

Требования к JSON:
Возврати ТОЛЬКО валидный JSON массив объектов без какого-либо лишнего текста или markdown оберток (никаких \`\`\`json).
Каждый объект массива должен содержать поля:
- "question": четкий вопрос или понятное предложение с термином
- "answer": емкий и развернутый правильный ответ
- "hint": подсказка или контекст
- "topicTag": название узкой подтемы/тега (например: "Анатомия", "Французская революция", "Алгоритмы")

Учебный материал:
${text.slice(0, 15000)}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || `Ошибка сервера Gemini: ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean potential markdown markdown formatting
    const cleanedJson = rawContent
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const parsedArray = JSON.parse(cleanedJson);
    const today = new Date().toISOString().split('T')[0];

    return parsedArray.map((item: any, idx: number) => ({
      id: `card-gemini-${Date.now()}-${idx}`,
      deckId,
      question: item.question || 'Вопрос',
      answer: item.answer || 'Ответ',
      hint: item.hint || undefined,
      topicTag: item.topicTag || 'ИИ генерация',
      interval: 0,
      repetition: 0,
      easeFactor: 2.5,
      dueDate: today,
      reviewHistory: [],
      failCount: 0,
      successCount: 0,
    }));
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
}

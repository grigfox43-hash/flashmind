import type { Deck, Flashcard, ExamResult } from '../types/flashcard';
import type { UserProfile } from '../components/UserCabinetModal';

const DB_NAME = 'FlashMindDatabase';
const DB_VERSION = 1;

export interface DBUser extends UserProfile {
  passwordHash?: string;
}

/**
 * Native IndexedDB Wrapper for FlashMind Application
 * Provides structured transactional database storage in the browser (Users, Decks, Cards, ExamResults)
 */
class AppDatabase {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = this.initDB();
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Users Table
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id' });
          userStore.createIndex('email', 'email', { unique: true });
        }

        // Decks Table
        if (!db.objectStoreNames.contains('decks')) {
          const deckStore = db.createObjectStore('decks', { keyPath: 'id' });
          deckStore.createIndex('userId', 'userId', { unique: false });
        }

        // Flashcards Table
        if (!db.objectStoreNames.contains('cards')) {
          const cardStore = db.createObjectStore('cards', { keyPath: 'id' });
          cardStore.createIndex('deckId', 'deckId', { unique: false });
          cardStore.createIndex('dueDate', 'dueDate', { unique: false });
        }

        // Exam Results Table
        if (!db.objectStoreNames.contains('examResults')) {
          const examStore = db.createObjectStore('examResults', { keyPath: 'id' });
          examStore.createIndex('userId', 'userId', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // --- USER DB OPERATIONS ---
  async getUserByEmail(email: string): Promise<DBUser | null> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('users', 'readonly');
      const store = tx.objectStore('users');
      const index = store.index('email');
      const request = index.get(email);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async saveUser(user: DBUser): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('users', 'readwrite');
      const store = tx.objectStore('users');
      const request = store.put(user);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --- DECK & CARDS DB OPERATIONS ---
  async getAllDecks(_userId: string = 'default'): Promise<Deck[]> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['decks', 'cards'], 'readonly');
      const deckStore = tx.objectStore('decks');
      const cardStore = tx.objectStore('cards');

      const decksRequest = deckStore.getAll();

      decksRequest.onsuccess = () => {
        const rawDecks: Deck[] = decksRequest.result || [];
        
        if (rawDecks.length === 0) {
          resolve([]);
          return;
        }

        const cardsRequest = cardStore.getAll();
        cardsRequest.onsuccess = () => {
          const allCards: Flashcard[] = cardsRequest.result || [];
          
          // Assemble decks with cards
          const assembled = rawDecks.map((deck) => ({
            ...deck,
            cards: allCards.filter((c) => c.deckId === deck.id),
          }));
          resolve(assembled);
        };
        cardsRequest.onerror = () => reject(cardsRequest.error);
      };
      decksRequest.onerror = () => reject(decksRequest.error);
    });
  }

  async saveAllDecks(decks: Deck[]): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['decks', 'cards'], 'readwrite');
      const deckStore = tx.objectStore('decks');
      const cardStore = tx.objectStore('cards');

      // Clear old data and put updated decks & cards
      deckStore.clear();
      cardStore.clear();

      decks.forEach((deck) => {
        const { cards, ...deckMeta } = deck;
        deckStore.put(deckMeta);
        cards.forEach((card) => {
          cardStore.put({ ...card, deckId: deck.id });
        });
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- EXAM RESULTS DB OPERATIONS ---
  async saveExamResult(result: ExamResult & { id?: string; userId?: string }): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('examResults', 'readwrite');
      const store = tx.objectStore('examResults');
      const record = {
        id: result.id || `exam-${Date.now()}`,
        userId: result.userId || 'default',
        ...result,
      };
      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getExamResults(_userId: string = 'default'): Promise<ExamResult[]> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('examResults', 'readonly');
      const store = tx.objectStore('examResults');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
}

export const appDB = new AppDatabase();

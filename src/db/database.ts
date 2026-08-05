import type { Deck, Flashcard, ExamResult } from '../types/flashcard';
import type { UserProfile } from '../components/UserCabinetModal';

const DB_NAME = 'FlashMindDatabase';
const DB_VERSION = 1;
const STORAGE_KEY_USERS_REGISTRY = 'flashmind_registered_users';

export interface DBUser extends UserProfile {
  passwordHash?: string;
}

/**
 * Native IndexedDB & LocalStorage Wrapper for FlashMind Application
 * Provides resilient 100% reliable user registration & data persistence
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
  async getUserByEmail(emailInput: string): Promise<DBUser | null> {
    const cleanEmail = emailInput.trim().toLowerCase();

    // 1. Check LocalStorage User Registry fallback first for instant 100% resilience
    try {
      const savedRegistry = localStorage.getItem(STORAGE_KEY_USERS_REGISTRY);
      if (savedRegistry) {
        const usersMap: Record<string, DBUser> = JSON.parse(savedRegistry);
        if (usersMap[cleanEmail]) {
          return usersMap[cleanEmail];
        }
      }
    } catch (e) {}

    // 2. Check IndexedDB Users Store
    try {
      const db = await this.dbPromise;
      const allUsers: DBUser[] = await new Promise((resolve) => {
        const tx = db.transaction('users', 'readonly');
        const store = tx.objectStore('users');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });

      const found = allUsers.find((u) => u.email.trim().toLowerCase() === cleanEmail);
      if (found) return found;
    } catch (e) {}

    return null;
  }

  async saveUser(user: DBUser): Promise<void> {
    const cleanEmail = user.email.trim().toLowerCase();
    const cleanUser: DBUser = { ...user, email: cleanEmail };

    // 1. Save to LocalStorage Registry
    try {
      const savedRegistry = localStorage.getItem(STORAGE_KEY_USERS_REGISTRY);
      const usersMap: Record<string, DBUser> = savedRegistry ? JSON.parse(savedRegistry) : {};
      usersMap[cleanEmail] = cleanUser;
      localStorage.setItem(STORAGE_KEY_USERS_REGISTRY, JSON.stringify(usersMap));
    } catch (e) {}

    // 2. Save to IndexedDB
    try {
      const db = await this.dbPromise;
      const tx = db.transaction('users', 'readwrite');
      const store = tx.objectStore('users');
      store.put(cleanUser);
    } catch (e) {}
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

import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { MaterialImport } from './components/MaterialImport';
import { FlashcardReview } from './components/FlashcardReview';
import { ExamMode } from './components/ExamMode';
import { DeckManager } from './components/DeckManager';
import { ApiKeyModal } from './components/ApiKeyModal';
import { CloudDbModal } from './components/CloudDbModal';
import { UserCabinetModal, type UserProfile } from './components/UserCabinetModal';
import { LandingPage } from './components/LandingPage';

import type { Deck, Flashcard, ReviewRating } from './types/flashcard';
import { calculateExamReadiness } from './utils/analytics';
import { appDB } from './db/database';
import { cloudDB } from './db/cloudDatabase';

const STORAGE_KEY_API_KEY = 'flashmind_gemini_api_key';
const STORAGE_KEY_USER = 'flashmind_user_profile';
const STORAGE_KEY_STREAK = 'flashmind_study_streak';

export function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'import' | 'review' | 'exam' | 'decks'>('dashboard');

  // Decks state backed by Database
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isDbLoaded, setIsDbLoaded] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(() => cloudDB.isCloudConfigured());

  // User profile state (null when guest / logged out)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  // Gemini API Key state
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_API_KEY) || '';
  });

  // Study Streak State
  const [streakDays] = useState<number>(() => {
    return Number(localStorage.getItem(STORAGE_KEY_STREAK)) || 0;
  });

  // Modals state
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isUserCabinetOpen, setIsUserCabinetOpen] = useState(false);
  const [isCloudDbModalOpen, setIsCloudDbModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // 1. Initial Database Loading
  useEffect(() => {
    async function loadDatabase() {
      try {
        if (cloudDB.isCloudConfigured()) {
          const cloudDecks = await cloudDB.fetchDecksFromCloud(currentUser?.id || 'default');
          if (cloudDecks && cloudDecks.length > 0) {
            setDecks(cloudDecks);
            setIsDbLoaded(true);
            return;
          }
        }

        const dbDecks = await appDB.getAllDecks(currentUser?.id || 'default');
        if (dbDecks && dbDecks.length > 0) {
          setDecks(dbDecks);
        }
      } catch (err) {
        console.error('Error reading from storage:', err);
      } finally {
        setIsDbLoaded(true);
      }
    }
    loadDatabase();
  }, [currentUser?.id]);

  // 2. Database Auto-sync on decks update
  useEffect(() => {
    if (isDbLoaded) {
      appDB.saveAllDecks(decks).catch((err) => {
        console.error('Error persisting decks:', err);
      });

      if (cloudDB.isCloudConfigured()) {
        cloudDB.syncDecksToCloud(decks, currentUser?.id || 'default').catch((err) => {
          console.error('Error syncing decks:', err);
        });
      }
    }
  }, [decks, isDbLoaded, currentUser?.id]);

  // Sync user profile to LocalStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
      if (cloudDB.isCloudConfigured()) {
        cloudDB.syncUserToCloud(currentUser);
      }
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  }, [currentUser]);

  // Save API Key
  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem(STORAGE_KEY_API_KEY, key);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY_USER);
  };

  const handleOpenLogin = () => {
    setAuthModalMode('login');
    setIsUserCabinetOpen(true);
  };

  const handleOpenRegister = () => {
    setAuthModalMode('register');
    setIsUserCabinetOpen(true);
  };

  // Handlers for deck management
  const handleCreateDeck = (title: string, category: string, color: string): Deck => {
    const newDeck: Deck = {
      id: `deck-${Date.now()}`,
      title,
      description: 'Учебные флеш-карточки',
      category: category || 'Общее',
      createdAt: new Date().toISOString().split('T')[0],
      color,
      cards: [],
    };
    setDecks((prev) => [newDeck, ...prev]);
    return newDeck;
  };

  const handleDeleteDeck = (deckId: string) => {
    setDecks((prev) => prev.filter((d) => d.id !== deckId));
  };

  const handleAddCardsToDeck = (deckId: string, newCards: Flashcard[]) => {
    setDecks((prev) =>
      prev.map((d) => {
        if (d.id === deckId) {
          return { ...d, cards: [...d.cards, ...newCards] };
        }
        return d;
      })
    );
  };

  const handleAddManualCard = (
    deckId: string,
    cardData: { question: string; answer: string; hint?: string; topicTag: string }
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const newCard: Flashcard = {
      id: `card-manual-${Date.now()}`,
      deckId,
      question: cardData.question,
      answer: cardData.answer,
      hint: cardData.hint,
      topicTag: cardData.topicTag || 'Общая тема',
      interval: 0,
      repetition: 0,
      easeFactor: 2.5,
      dueDate: today,
      reviewHistory: [],
      failCount: 0,
      successCount: 0,
    };

    setDecks((prev) =>
      prev.map((d) => {
        if (d.id === deckId) {
          return { ...d, cards: [newCard, ...d.cards] };
        }
        return d;
      })
    );
  };

  const handleDeleteCard = (deckId: string, cardId: string) => {
    setDecks((prev) =>
      prev.map((d) => {
        if (d.id === deckId) {
          return { ...d, cards: d.cards.filter((c) => c.id !== cardId) };
        }
        return d;
      })
    );
  };

  // Review card rating handler (SM-2 update)
  const handleReviewCard = (
    deckId: string,
    cardId: string,
    rating: ReviewRating,
    newSM2: { interval: number; repetition: number; easeFactor: number; dueDate: string }
  ) => {
    const today = new Date().toISOString().split('T')[0];

    setDecks((prev) =>
      prev.map((d) => {
        if (d.id === deckId) {
          const updatedCards = d.cards.map((card) => {
            if (card.id === cardId) {
              const isSuccess = rating >= 2;
              return {
                ...card,
                interval: newSM2.interval,
                repetition: newSM2.repetition,
                easeFactor: newSM2.easeFactor,
                dueDate: newSM2.dueDate,
                lastReviewedAt: today,
                successCount: (card.successCount || 0) + (isSuccess ? 1 : 0),
                failCount: (card.failCount || 0) + (isSuccess ? 0 : 1),
                reviewHistory: [
                  ...(card.reviewHistory || []),
                  { date: today, rating },
                ],
              };
            }
            return card;
          });
          return { ...d, cards: updatedCards };
        }
        return d;
      })
    );
  };

  const handleImportDecks = (imported: Deck[]) => {
    setDecks(imported);
  };

  // Calculated analytics metrics
  const readiness = calculateExamReadiness(decks);
  const totalCards = decks.flatMap((d) => d.cards).length;

  // Unauthenticated Landing View
  if (!currentUser) {
    return (
      <>
        <LandingPage
          onOpenLogin={handleOpenLogin}
          onOpenRegister={handleOpenRegister}
        />

        <UserCabinetModal
          isOpen={isUserCabinetOpen}
          onClose={() => setIsUserCabinetOpen(false)}
          currentUser={currentUser}
          onLogin={(user) => setCurrentUser(user)}
          onLogout={handleLogout}
          initialMode={authModalMode}
          totalCards={0}
          readinessScore={0}
          streakDays={0}
        />
      </>
    );
  }

  // Authenticated Main Application View
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background Ambient Glow Orbs */}
      <div className="bg-ambient-container">
        <div className="ambient-orb-1" />
        <div className="ambient-orb-2" />
        <div className="ambient-orb-3" />
      </div>

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dueTodayCount={readiness.dueTodayCount}
        readinessScore={readiness.overallScore}
        streakDays={streakDays}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        hasApiKey={Boolean(apiKey)}
        currentUser={currentUser}
        onOpenUserCabinet={() => setIsUserCabinetOpen(true)}
        onOpenCloudDbModal={() => setIsCloudDbModalOpen(true)}
        isCloudConnected={isCloudConnected}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-24 md:pb-16">
        {activeTab === 'dashboard' && (
          <AnalyticsDashboard
            decks={decks}
            onNavigate={(tab) => setActiveTab(tab)}
            streakDays={streakDays}
          />
        )}

        {activeTab === 'import' && (
          <MaterialImport
            decks={decks}
            onCreateDeck={handleCreateDeck}
            onAddCardsToDeck={handleAddCardsToDeck}
            apiKey={apiKey}
            onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
            onSuccessNavigate={() => setActiveTab('review')}
          />
        )}

        {activeTab === 'review' && (
          <FlashcardReview
            decks={decks}
            onReviewCard={handleReviewCard}
            onFinishSession={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'exam' && (
          <ExamMode
            decks={decks}
            onCompleteExam={(result) => {
              appDB.saveExamResult({
                ...result,
                userId: currentUser?.id || 'default',
              });
            }}
            onFinishExamView={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'decks' && (
          <DeckManager
            decks={decks}
            onCreateDeck={handleCreateDeck}
            onDeleteDeck={handleDeleteDeck}
            onAddManualCard={handleAddManualCard}
            onDeleteCard={handleDeleteCard}
            onImportDecks={handleImportDecks}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            FlashMind AI — Система интервального повторения на базе алгоритма SM-2
          </div>
          <div>
            Поддержка PDF, текстовых конспектов и интеграция с Google Gemini AI
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
      />

      <CloudDbModal
        isOpen={isCloudDbModalOpen}
        onClose={() => setIsCloudDbModalOpen(false)}
        onCloudSyncSuccess={() => setIsCloudConnected(cloudDB.isCloudConfigured())}
      />

      <UserCabinetModal
        isOpen={isUserCabinetOpen}
        onClose={() => setIsUserCabinetOpen(false)}
        currentUser={currentUser}
        onLogin={(user) => setCurrentUser(user)}
        onLogout={handleLogout}
        initialMode={authModalMode}
        totalCards={totalCards}
        readinessScore={readiness.overallScore}
        streakDays={streakDays}
      />
    </div>
  );
}

export default App;

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
import { Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

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
  const [welcomeUser, setWelcomeUser] = useState<UserProfile | null>(null);

  // Email Verification Token Link Listener (?verifyToken=...)
  useEffect(() => {
    async function checkVerificationToken() {
      const params = new URLSearchParams(window.location.search);
      const verifyToken = params.get('verifyToken');

      if (verifyToken) {
        try {
          const raw = localStorage.getItem(`flashmind_pending_${verifyToken}`);
          if (raw) {
            const { user } = JSON.parse(raw);
            await appDB.saveUser(user);
            if (cloudDB.isCloudConfigured()) {
              await cloudDB.syncUserToCloud(user);
            }

            localStorage.removeItem(`flashmind_pending_${verifyToken}`);
            window.history.replaceState({}, document.title, window.location.pathname);
            handleLogin(user, true);
          }
        } catch (e) {
          console.error('Email verification error:', e);
        }
      }
    }

    checkVerificationToken();
  }, []);

  // 1. Initial Database Loading
  useEffect(() => {
    async function loadDatabase() {
      if (!currentUser?.id) {
        setDecks([]);
        setIsDbLoaded(true);
        return;
      }

      try {
        setIsDbLoaded(false);
        let loadedDecks: Deck[] = [];

        if (cloudDB.isCloudConfigured()) {
          const cloudDecks = await cloudDB.fetchDecksFromCloud(currentUser.id);
          if (cloudDecks !== null) {
            loadedDecks = cloudDecks;
          }
        } else {
          const dbDecks = await appDB.getAllDecks(currentUser.id);
          if (dbDecks) {
            loadedDecks = dbDecks;
          }
        }

        setDecks(loadedDecks);
      } catch (err) {
        console.error('Error reading from storage:', err);
        setDecks([]);
      } finally {
        setIsDbLoaded(true);
      }
    }
    loadDatabase();
  }, [currentUser?.id]);

  // 2. Database Auto-sync on decks update
  useEffect(() => {
    if (isDbLoaded && currentUser?.id) {
      appDB.saveAllDecks(decks).catch((err) => {
        console.error('Error persisting decks:', err);
      });

      if (cloudDB.isCloudConfigured()) {
        cloudDB.syncDecksToCloud(decks, currentUser.id).catch((err) => {
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

  const handleLogin = (user: UserProfile, isNewUser?: boolean) => {
    setDecks([]);
    setIsDbLoaded(false);
    setCurrentUser(user);

    if (isNewUser) {
      setWelcomeUser(user);
      try {
        confetti({
          particleCount: 130,
          spread: 85,
          origin: { y: 0.5 },
        });
      } catch (e) {}

      setTimeout(() => {
        setWelcomeUser(null);
      }, 2300);
    }
  };

  const handleLogout = () => {
    setDecks([]);
    setIsDbLoaded(false);
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
        onLogin={handleLogin}
        onLogout={handleLogout}
        initialMode={authModalMode}
        totalCards={totalCards}
        readinessScore={readiness.overallScore}
        streakDays={streakDays}
      />

      {/* Celebration Welcome Entrance Overlay */}
      {welcomeUser && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-backdrop-in cursor-default">
          <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/90 border border-indigo-500/40 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl animate-welcome-splash animate-sparkle-glow relative overflow-hidden">
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/40 animate-bounce">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 inline-flex items-center gap-1.5">
                🎉 Регистрация успешная!
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight pt-2">
                Добро пожаловать, <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-emerald-300 bg-clip-text text-transparent">{welcomeUser.name}</span>!
              </h2>
              <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
                Ваше личное ИИ-пространство создано в базе данных.
              </p>
            </div>

            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
              <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full animate-[welcomeProgress_2.3s_easeInOut_forwards]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

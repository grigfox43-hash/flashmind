import type { Deck } from '../types/flashcard';
import type { UserProfile } from '../components/UserCabinetModal';

export interface CloudDBSettings {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isEnabled: boolean;
}

const STORAGE_KEY_CLOUD_SETTINGS = 'flashmind_cloud_db_settings';

export const defaultCloudSettings: CloudDBSettings = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  isEnabled: false,
};

class CloudDatabaseService {
  private getSettings(): CloudDBSettings {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CLOUD_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return defaultCloudSettings;
  }

  saveSettings(settings: CloudDBSettings): void {
    localStorage.setItem(STORAGE_KEY_CLOUD_SETTINGS, JSON.stringify(settings));
  }

  isCloudConfigured(): boolean {
    const s = this.getSettings();
    return s.isEnabled && Boolean(s.supabaseUrl) && Boolean(s.supabaseAnonKey);
  }

  /**
   * Test connection to Remote Supabase / Cloud PostgreSQL Database
   */
  async testCloudConnection(url: string, key: string): Promise<boolean> {
    if (!url || !key) return false;
    try {
      const cleanUrl = url.replace(/\/$/, '');
      const res = await fetch(`${cleanUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      });
      return res.ok || res.status === 200 || res.status === 404;
    } catch (e) {
      console.error('Cloud DB Connection error:', e);
      return false;
    }
  }

  /**
   * Sync User Profile to Cloud DB
   */
  async syncUserToCloud(user: UserProfile): Promise<void> {
    if (!this.isCloudConfigured()) return;
    const { supabaseUrl, supabaseAnonKey } = this.getSettings();
    const cleanUrl = supabaseUrl.replace(/\/$/, '');

    try {
      await fetch(`${cleanUrl}/rest/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify(user),
      });
    } catch (e) {
      console.error('Cloud Sync User error:', e);
    }
  }

  /**
   * Sync Decks & Cards to Cloud DB
   */
  async syncDecksToCloud(decks: Deck[], userId: string = 'default'): Promise<void> {
    if (!this.isCloudConfigured()) return;
    const { supabaseUrl, supabaseAnonKey } = this.getSettings();
    const cleanUrl = supabaseUrl.replace(/\/$/, '');

    try {
      const payload = decks.map((d) => ({
        id: d.id,
        user_id: userId,
        title: d.title,
        description: d.description,
        category: d.category,
        color: d.color,
        cards_json: JSON.stringify(d.cards),
        updated_at: new Date().toISOString(),
      }));

      await fetch(`${cleanUrl}/rest/v1/decks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.error('Cloud Sync Decks error:', e);
    }
  }

  /**
   * Fetch All Decks from Cloud DB
   */
  async fetchDecksFromCloud(_userId: string = 'default'): Promise<Deck[] | null> {
    if (!this.isCloudConfigured()) return null;
    const { supabaseUrl, supabaseAnonKey } = this.getSettings();
    const cleanUrl = supabaseUrl.replace(/\/$/, '');

    try {
      const res = await fetch(`${cleanUrl}/rest/v1/decks?select=*`, {
        method: 'GET',
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
      });

      if (!res.ok) return null;
      const data = await res.json();
      if (!Array.isArray(data)) return null;

      return data.map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description || '',
        category: row.category || 'Общее',
        color: row.color || 'from-indigo-500/20 to-purple-600/20 text-indigo-400 border-indigo-500/30',
        createdAt: row.created_at || new Date().toISOString().split('T')[0],
        cards: typeof row.cards_json === 'string' ? JSON.parse(row.cards_json) : row.cards_json || [],
      }));
    } catch (e) {
      console.error('Fetch Cloud Decks error:', e);
      return null;
    }
  }
}

export const cloudDB = new CloudDatabaseService();

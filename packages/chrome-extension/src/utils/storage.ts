/**
 * StorageManager - Handles Chrome extension storage operations
 */
export class StorageManager {
  private static readonly STORAGE_KEYS = {
    SESSIONS: 'website_sessions',
    PENDING_SESSIONS: 'pending_sessions',
    SETTINGS: 'settings',
    AUTH_TOKEN: 'auth_token',
    USER_DATA: 'user_data',
    DAILY_STATS: 'daily_stats',
    CATEGORIES: 'custom_categories'
  } as const;

  /**
   * Save a website session
   */
  async saveSession(sessionData: WebsiteSession): Promise<void> {
    try {
      const existingSessions = await this.getAllSessions();
      const todayKey = this.getTodayKey();
      
      if (!existingSessions[todayKey]) {
        existingSessions[todayKey] = [];
      }
      
      existingSessions[todayKey].push(sessionData);
      
      await chrome.storage.local.set({
        [StorageManager.STORAGE_KEYS.SESSIONS]: existingSessions
      });

      // Also add to pending sessions for sync
      await this.addToPendingSessions(sessionData);
      
      // Update daily stats
      await this.updateDailyStats(sessionData);
      
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  /**
   * Get all sessions
   */
  async getAllSessions(): Promise<Record<string, WebsiteSession[]>> {
    try {
      const result = await chrome.storage.local.get(StorageManager.STORAGE_KEYS.SESSIONS);
      return result[StorageManager.STORAGE_KEYS.SESSIONS] || {};
    } catch (error) {
      console.error('Error getting sessions:', error);
      return {};
    }
  }

  /**
   * Get today's sessions
   */
  async getTodaySessions(): Promise<WebsiteSession[]> {
    try {
      const allSessions = await this.getAllSessions();
      const todayKey = this.getTodayKey();
      return allSessions[todayKey] || [];
    } catch (error) {
      console.error('Error getting today sessions:', error);
      return [];
    }
  }

  /**
   * Get sessions for a specific date range
   */
  async getSessionsInRange(startDate: Date, endDate: Date): Promise<WebsiteSession[]> {
    try {
      const allSessions = await this.getAllSessions();
      const sessions: WebsiteSession[] = [];
      
      const start = new Date(startDate).setHours(0, 0, 0, 0);
      const end = new Date(endDate).setHours(23, 59, 59, 999);
      
      Object.values(allSessions).forEach(daySessions => {
        daySessions.forEach(session => {
          if (session.startTime >= start && session.startTime <= end) {
            sessions.push(session);
          }
        });
      });
      
      return sessions.sort((a, b) => a.startTime - b.startTime);
    } catch (error) {
      console.error('Error getting sessions in range:', error);
      return [];
    }
  }

  /**
   * Add session to pending sync queue
   */
  async addToPendingSessions(sessionData: WebsiteSession): Promise<void> {
    try {
      const pending = await this.getPendingSessions();
      pending.push(sessionData);
      
      await chrome.storage.local.set({
        [StorageManager.STORAGE_KEYS.PENDING_SESSIONS]: pending
      });
    } catch (error) {
      console.error('Error adding to pending sessions:', error);
    }
  }

  /**
   * Get pending sessions for sync
   */
  async getPendingSessions(): Promise<WebsiteSession[]> {
    try {
      const result = await chrome.storage.local.get(StorageManager.STORAGE_KEYS.PENDING_SESSIONS);
      return result[StorageManager.STORAGE_KEYS.PENDING_SESSIONS] || [];
    } catch (error) {
      console.error('Error getting pending sessions:', error);
      return [];
    }
  }

  /**
   * Clear pending sessions after successful sync
   */
  async clearPendingSessions(): Promise<void> {
    try {
      await chrome.storage.local.set({
        [StorageManager.STORAGE_KEYS.PENDING_SESSIONS]: []
      });
    } catch (error) {
      console.error('Error clearing pending sessions:', error);
    }
  }

  /**
   * Get extension settings
   */
  async getSettings(): Promise<ExtensionSettings> {
    try {
      const result = await chrome.storage.local.get(StorageManager.STORAGE_KEYS.SETTINGS);
      return {
        trackingEnabled: true,
        idleThreshold: 60,
        syncInterval: 5,
        showNotifications: true,
        productivityGoal: 480, // 8 hours in minutes
        focusMode: false,
        excludedDomains: [],
        ...result[StorageManager.STORAGE_KEYS.SETTINGS]
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      return {
        trackingEnabled: true,
        idleThreshold: 60,
        syncInterval: 5,
        showNotifications: true,
        productivityGoal: 480,
        focusMode: false,
        excludedDomains: []
      };
    }
  }

  /**
   * Save extension settings
   */
  async saveSettings(settings: Partial<ExtensionSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      
      await chrome.storage.local.set({
        [StorageManager.STORAGE_KEYS.SETTINGS]: updatedSettings
      });
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  /**
   * Set a specific setting
   */
  async setSetting<K extends keyof ExtensionSettings>(
    key: K, 
    value: ExtensionSettings[K]
  ): Promise<void> {
    const settings = await this.getSettings();
    settings[key] = value;
    await this.saveSettings(settings);
  }

  /**
   * Get auth token
   */
  async getAuthToken(): Promise<string | null> {
    try {
      const result = await chrome.storage.local.get(StorageManager.STORAGE_KEYS.AUTH_TOKEN);
      return result[StorageManager.STORAGE_KEYS.AUTH_TOKEN] || null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Save auth token
   */
  async saveAuthToken(token: string): Promise<void> {
    try {
      await chrome.storage.local.set({
        [StorageManager.STORAGE_KEYS.AUTH_TOKEN]: token
      });
    } catch (error) {
      console.error('Error saving auth token:', error);
    }
  }

  /**
   * Clear auth token
   */
  async clearAuthToken(): Promise<void> {
    try {
      await chrome.storage.local.remove(StorageManager.STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error clearing auth token:', error);
    }
  }

  /**
   * Get today's statistics
   */
  async getTodayStats(): Promise<DailyStats> {
    try {
      const sessions = await this.getTodaySessions();
      
      if (sessions.length === 0) {
        return {
          totalTime: 0,
          productiveTime: 0,
          distractingTime: 0,
          topDomains: [],
          categoryBreakdown: {},
          productivityScore: 0,
          sessionsCount: 0
        };
      }

      const totalTime = sessions.reduce((sum, session) => sum + session.duration, 0);
      const productiveSessions = sessions.filter(s => 
        ['coding', 'productivity', 'learning', 'documentation'].includes(s.category)
      );
      const productiveTime = productiveSessions.reduce((sum, session) => sum + session.duration, 0);
      const distractingTime = totalTime - productiveTime;

      // Calculate top domains
      const domainTime: Record<string, number> = {};
      sessions.forEach(session => {
        domainTime[session.domain] = (domainTime[session.domain] || 0) + session.duration;
      });
      
      const topDomains = Object.entries(domainTime)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([domain, time]) => ({ domain, time }));

      // Calculate category breakdown
      const categoryBreakdown: Record<string, number> = {};
      sessions.forEach(session => {
        categoryBreakdown[session.category] = (categoryBreakdown[session.category] || 0) + session.duration;
      });

      // Calculate average productivity score
      const avgProductivityScore = sessions.length > 0 
        ? sessions.reduce((sum, session) => sum + session.productivityScore, 0) / sessions.length
        : 0;

      return {
        totalTime,
        productiveTime,
        distractingTime,
        topDomains,
        categoryBreakdown,
        productivityScore: Math.round(avgProductivityScore),
        sessionsCount: sessions.length
      };
    } catch (error) {
      console.error('Error getting today stats:', error);
      return {
        totalTime: 0,
        productiveTime: 0,
        distractingTime: 0,
        topDomains: [],
        categoryBreakdown: {},
        productivityScore: 0,
        sessionsCount: 0
      };
    }
  }

  /**
   * Update daily statistics
   */
  private async updateDailyStats(sessionData: WebsiteSession): Promise<void> {
    // This is handled in getTodayStats, but could be cached for performance
  }

  /**
   * Get today's date key for storage
   */
  private getTodayKey(): string {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  /**
   * Clear old data (keep last 30 days)
   */
  async cleanupOldData(): Promise<void> {
    try {
      const allSessions = await this.getAllSessions();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const cleanedSessions: Record<string, WebsiteSession[]> = {};
      
      Object.entries(allSessions).forEach(([dateKey, sessions]) => {
        const sessionDate = new Date(dateKey);
        if (sessionDate >= thirtyDaysAgo) {
          cleanedSessions[dateKey] = sessions;
        }
      });
      
      await chrome.storage.local.set({
        [StorageManager.STORAGE_KEYS.SESSIONS]: cleanedSessions
      });
      
      console.log('🧹 Cleaned up old session data');
    } catch (error) {
      console.error('Error cleaning up old data:', error);
    }
  }
}

// Type definitions
export interface WebsiteSession {
  domain: string;
  category: string;
  startTime: number;
  endTime: number;
  duration: number;
  idleTime: number;
  productivityScore: number;
  url?: string;
  title?: string;
}

export interface ExtensionSettings {
  trackingEnabled: boolean;
  idleThreshold: number; // seconds
  syncInterval: number; // minutes
  showNotifications: boolean;
  productivityGoal: number; // minutes per day
  focusMode: boolean;
  excludedDomains: string[];
}

export interface DailyStats {
  totalTime: number;
  productiveTime: number;
  distractingTime: number;
  topDomains: Array<{ domain: string; time: number }>;
  categoryBreakdown: Record<string, number>;
  productivityScore: number;
  sessionsCount: number;
} 
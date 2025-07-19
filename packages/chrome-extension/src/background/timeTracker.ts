/**
 * TimeTracker - Handles real-time session tracking and productivity monitoring
 */
export class TimeTracker {
  private currentSession: {
    domain: string;
    category: string;
    startTime: number;
    lastUpdate: number;
  } | null = null;

  private productivityTimer: number | null = null;
  private updateInterval: number | null = null;

  constructor() {
    this.startProductivityMonitoring();
  }

  /**
   * Start a new tracking session
   */
  startSession(domain: string, category: string): void {
    // End previous session if exists
    if (this.currentSession) {
      this.endSession();
    }

    this.currentSession = {
      domain,
      category,
      startTime: Date.now(),
      lastUpdate: Date.now()
    };

    console.log(`⏱️ Started tracking session: ${domain} (${category})`);
    
    // Start update interval for real-time tracking
    this.startUpdateInterval();
  }

  /**
   * End the current tracking session
   */
  endSession(): void {
    if (!this.currentSession) return;

    const duration = Date.now() - this.currentSession.startTime;
    console.log(`⏹️ Ended session: ${this.currentSession.domain} (${Math.round(duration / 1000)}s)`);

    this.currentSession = null;
    this.stopUpdateInterval();
  }

  /**
   * Get current session info
   */
  getCurrentSession(): {
    domain: string;
    category: string;
    duration: number;
    isActive: boolean;
  } | null {
    if (!this.currentSession) return null;

    return {
      domain: this.currentSession.domain,
      category: this.currentSession.category,
      duration: Date.now() - this.currentSession.startTime,
      isActive: true
    };
  }

  /**
   * Update session activity (called when user is active)
   */
  updateActivity(): void {
    if (this.currentSession) {
      this.currentSession.lastUpdate = Date.now();
    }
  }

  /**
   * Check if current session is idle
   */
  isSessionIdle(idleThresholdMs: number = 60000): boolean {
    if (!this.currentSession) return false;
    
    return (Date.now() - this.currentSession.lastUpdate) > idleThresholdMs;
  }

  /**
   * Get session idle time
   */
  getSessionIdleTime(): number {
    if (!this.currentSession) return 0;
    
    const idleTime = Date.now() - this.currentSession.lastUpdate;
    return Math.max(0, idleTime);
  }

  /**
   * Pause current session
   */
  pauseSession(): void {
    if (this.currentSession) {
      this.stopUpdateInterval();
      console.log(`⏸️ Paused session: ${this.currentSession.domain}`);
    }
  }

  /**
   * Resume current session
   */
  resumeSession(): void {
    if (this.currentSession) {
      this.currentSession.lastUpdate = Date.now();
      this.startUpdateInterval();
      console.log(`▶️ Resumed session: ${this.currentSession.domain}`);
    }
  }

  /**
   * Get today's total active time
   */
  async getTodayActiveTime(): Promise<number> {
    try {
      // This would typically fetch from storage
      // For now, return current session time if exists
      if (this.currentSession) {
        return Date.now() - this.currentSession.startTime;
      }
      return 0;
    } catch (error) {
      console.error('Error getting today active time:', error);
      return 0;
    }
  }

  /**
   * Calculate productivity score for current session
   */
  calculateCurrentProductivityScore(): number {
    if (!this.currentSession) return 0;

    const totalDuration = Date.now() - this.currentSession.startTime;
    const idleTime = this.getSessionIdleTime();
    const activeTime = totalDuration - idleTime;
    const activeRatio = activeTime / totalDuration;

    // Base score based on category
    const categoryScores: Record<string, number> = {
      coding: 100,
      productivity: 80,
      learning: 90,
      documentation: 85,
      communication: 60,
      social: 20,
      entertainment: 10,
      shopping: 30,
      news: 40,
      other: 50
    };

    const baseScore = categoryScores[this.currentSession.category] || 50;
    
    // Adjust based on active time ratio
    return Math.round(baseScore * activeRatio);
  }

  /**
   * Get real-time session stats
   */
  getRealtimeStats(): {
    isTracking: boolean;
    currentDomain?: string;
    currentCategory?: string;
    sessionDuration?: number;
    idleTime?: number;
    productivityScore?: number;
    activeRatio?: number;
  } {
    if (!this.currentSession) {
      return { isTracking: false };
    }

    const totalDuration = Date.now() - this.currentSession.startTime;
    const idleTime = this.getSessionIdleTime();
    const activeTime = totalDuration - idleTime;
    const activeRatio = activeTime / totalDuration;

    return {
      isTracking: true,
      currentDomain: this.currentSession.domain,
      currentCategory: this.currentSession.category,
      sessionDuration: totalDuration,
      idleTime,
      productivityScore: this.calculateCurrentProductivityScore(),
      activeRatio
    };
  }

  /**
   * Set up productivity monitoring
   */
  private startProductivityMonitoring(): void {
    // Monitor productivity every minute
    this.productivityTimer = window.setInterval(() => {
      this.checkProductivityAlerts();
    }, 60000); // 1 minute
  }

  /**
   * Check for productivity alerts and notifications
   */
  private checkProductivityAlerts(): void {
    if (!this.currentSession) return;

    const stats = this.getRealtimeStats();
    const sessionDurationMinutes = (stats.sessionDuration || 0) / (1000 * 60);

    // Alert if session is too long on distracting sites
    if (sessionDurationMinutes > 30 && stats.productivityScore && stats.productivityScore < 40) {
      this.sendProductivityAlert('distraction', sessionDurationMinutes);
    }

    // Celebrate productive sessions
    if (sessionDurationMinutes > 60 && stats.productivityScore && stats.productivityScore > 80) {
      this.sendProductivityAlert('productive', sessionDurationMinutes);
    }

    // Alert on excessive idle time
    if (stats.idleTime && stats.idleTime > 5 * 60 * 1000) { // 5 minutes
      this.sendProductivityAlert('idle', stats.idleTime / (1000 * 60));
    }
  }

  /**
   * Send productivity alerts
   */
  private sendProductivityAlert(type: 'distraction' | 'productive' | 'idle', value: number): void {
    // Check if notifications are enabled in settings
    chrome.storage.local.get('settings').then(result => {
      const settings = result.settings || {};
      if (!settings.showNotifications) return;

      let title = '';
      let message = '';
      let icon = '';

      switch (type) {
        case 'distraction':
          title = '⚠️ Distraction Alert';
          message = `You've been on ${this.currentSession?.domain} for ${Math.round(value)} minutes. Consider taking a break or switching to productive work.`;
          icon = '⚠️';
          break;
        case 'productive':
          title = '🎉 Great Work!';
          message = `Amazing! You've been productive for ${Math.round(value)} minutes. Keep up the excellent work!`;
          icon = '🎉';
          break;
        case 'idle':
          title = '😴 Idle Time Detected';
          message = `You've been idle for ${Math.round(value)} minutes. Consider taking a proper break or resuming work.`;
          icon = '😴';
          break;
      }

      // Send notification
      chrome.notifications?.create({
        type: 'basic',
        iconUrl: '/icons/icon-48.png',
        title,
        message
      });
    });
  }

  /**
   * Start update interval for real-time tracking
   */
  private startUpdateInterval(): void {
    this.stopUpdateInterval();
    
    // Update every 10 seconds
    this.updateInterval = window.setInterval(() => {
      if (this.currentSession) {
        // Send update to popup if open
        chrome.runtime.sendMessage({
          type: 'SESSION_UPDATE',
          data: this.getRealtimeStats()
        }).catch(() => {
          // Popup might not be open, ignore error
        });
      }
    }, 10000); // 10 seconds
  }

  /**
   * Stop update interval
   */
  private stopUpdateInterval(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.endSession();
    
    if (this.productivityTimer) {
      clearInterval(this.productivityTimer);
      this.productivityTimer = null;
    }
    
    this.stopUpdateInterval();
  }

  /**
   * Export session data for analysis
   */
  exportSessionData(): any {
    return {
      currentSession: this.currentSession,
      realtimeStats: this.getRealtimeStats(),
      timestamp: Date.now()
    };
  }
} 
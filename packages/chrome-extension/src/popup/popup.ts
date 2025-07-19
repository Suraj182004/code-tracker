import './popup.css';

/**
 * Popup Controller - Handles all popup interactions and data updates
 */
class PopupController {
  private updateInterval: number | null = null;
  private currentSessionData: any = null;
  private isAuthenticated = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize popup
   */
  async initialize() {
    console.log('🚀 Popup initialized');
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Load initial data
    await this.loadInitialData();
    
    // Start real-time updates
    this.startRealTimeUpdates();
  }

  /**
   * Set up event listeners for all interactive elements
   */
  setupEventListeners() {
    // Toggle tracking button
    const toggleBtn = document.getElementById('toggleTracking');
    toggleBtn?.addEventListener('click', () => this.toggleTracking());

    // Settings button
    const settingsBtn = document.getElementById('settingsBtn');
    settingsBtn?.addEventListener('click', () => this.openSettings());

    // Focus mode button
    const focusModeBtn = document.getElementById('focusModeBtn');
    focusModeBtn?.addEventListener('click', () => this.toggleFocusMode());

    // Analytics button
    const analyticsBtn = document.getElementById('analyticsBtn');
    analyticsBtn?.addEventListener('click', () => this.openAnalytics());

    // Sync button
    const syncBtn = document.getElementById('syncBtn');
    syncBtn?.addEventListener('click', () => this.syncData());

    // Sign in button
    const signInBtn = document.getElementById('signInBtn');
    signInBtn?.addEventListener('click', () => this.openSignIn());

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message) => {
      this.handleBackgroundMessage(message);
    });
  }

  /**
   * Load initial data when popup opens
   */
  async loadInitialData() {
    try {
      this.showLoading(true);

      // Get current session data
      const sessionResponse = await this.sendMessageToBackground('GET_CURRENT_SESSION');
      this.currentSessionData = sessionResponse;

      // Get today's stats
      const statsResponse = await this.sendMessageToBackground('GET_TODAY_STATS');

      // Check authentication status
      await this.checkAuthStatus();

      // Update UI with data
      this.updateCurrentSession(sessionResponse);
      this.updateTodayStats(statsResponse);
      this.updateAuthUI();

    } catch (error) {
      console.error('Error loading initial data:', error);
      this.showError('Failed to load data');
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Update current session display
   */
  updateCurrentSession(sessionData: any) {
    const { session, isTrackingEnabled, isIdle } = sessionData;

    // Update status indicator
    const statusIndicator = document.getElementById('statusIndicator');
    const currentDomain = document.getElementById('currentDomain');
    const currentCategory = document.getElementById('currentCategory');
    const toggleBtn = document.getElementById('toggleTracking');

    if (session && isTrackingEnabled) {
      // Active session
      statusIndicator?.classList.remove('bg-dev-accent-warning', 'bg-dev-accent-danger', 'bg-dev-text-muted');
      statusIndicator?.classList.add(isIdle ? 'bg-dev-accent-warning' : 'bg-dev-accent-success');
      
      if (currentDomain) currentDomain.textContent = session.domain;
      if (currentCategory) currentCategory.textContent = this.getCategoryDisplayName(session.category);
      
      if (toggleBtn) {
        toggleBtn.textContent = 'Pause';
        toggleBtn.classList.remove('btn-inactive');
        toggleBtn.classList.add('btn-active');
      }

      // Update session info
      this.updateSessionInfo(session);
      document.getElementById('currentSession')?.classList.remove('hidden');

    } else {
      // No active session
      statusIndicator?.classList.remove('bg-dev-accent-success', 'bg-dev-accent-warning');
      statusIndicator?.classList.add(isTrackingEnabled ? 'bg-dev-text-muted' : 'bg-dev-accent-danger');
      
      if (currentDomain) currentDomain.textContent = isTrackingEnabled ? 'No active session' : 'Tracking paused';
      if (currentCategory) currentCategory.textContent = isTrackingEnabled ? 'Open a website to start tracking' : 'Click Resume to continue';
      
      if (toggleBtn) {
        toggleBtn.textContent = isTrackingEnabled ? 'Resume' : 'Start';
        toggleBtn.classList.remove('btn-active');
        toggleBtn.classList.add('btn-inactive');
      }

      document.getElementById('currentSession')?.classList.add('hidden');
    }
  }

  /**
   * Update session time and productivity info
   */
  updateSessionInfo(session: any) {
    const sessionTime = document.getElementById('sessionTime');
    const productivityScore = document.getElementById('productivityScore');
    const productivityBar = document.getElementById('productivityBar');

    if (session) {
      const duration = Date.now() - session.startTime;
      const formattedTime = this.formatDuration(duration);
      
      if (sessionTime) sessionTime.textContent = formattedTime;

      // Calculate real-time productivity score
      const score = this.calculateProductivityScore(session.category, duration);
      if (productivityScore) {
        productivityScore.textContent = `${score}%`;
        productivityScore.className = `font-mono ${this.getScoreClass(score)}`;
      }

      if (productivityBar) {
        productivityBar.style.width = `${score}%`;
        productivityBar.className = `h-2 rounded-full transition-all duration-500 ${this.getProgressBarClass(score)}`;
      }
    }
  }

  /**
   * Update today's statistics
   */
  updateTodayStats(stats: any) {
    const todayTotalTime = document.getElementById('todayTotalTime');
    const todayProductiveTime = document.getElementById('todayProductiveTime');
    const categoryBreakdown = document.getElementById('categoryBreakdown');
    const topDomains = document.getElementById('topDomains');

    if (todayTotalTime) {
      todayTotalTime.textContent = this.formatDuration(stats.totalTime || 0);
    }

    if (todayProductiveTime) {
      todayProductiveTime.textContent = this.formatDuration(stats.productiveTime || 0);
    }

    // Update category breakdown
    if (categoryBreakdown && stats.categoryBreakdown) {
      this.renderCategoryBreakdown(stats.categoryBreakdown, stats.totalTime);
    }

    // Update top domains
    if (topDomains && stats.topDomains) {
      this.renderTopDomains(stats.topDomains);
    }
  }

  /**
   * Render category breakdown bars
   */
  renderCategoryBreakdown(breakdown: Record<string, number>, totalTime: number) {
    const container = document.getElementById('categoryBreakdown');
    if (!container || totalTime === 0) return;

    container.innerHTML = '';

    Object.entries(breakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3) // Show top 3 categories
      .forEach(([category, time]) => {
        const percentage = Math.round((time / totalTime) * 100);
        
        const categoryEl = document.createElement('div');
        categoryEl.className = 'flex items-center justify-between text-xs';
        categoryEl.innerHTML = `
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 rounded-full category-${category}"></div>
            <span class="text-dev-text-secondary">${this.getCategoryDisplayName(category)}</span>
          </div>
          <div class="flex items-center space-x-2">
            <span class="font-mono text-dev-text-primary">${this.formatDuration(time)}</span>
            <span class="text-dev-text-muted">${percentage}%</span>
          </div>
        `;
        
        container.appendChild(categoryEl);
      });
  }

  /**
   * Render top domains list
   */
  renderTopDomains(domains: Array<{ domain: string; time: number }>) {
    const container = document.getElementById('topDomains');
    if (!container) return;

    container.innerHTML = '';

    domains.slice(0, 3).forEach((domainData, index) => {
      const domainEl = document.createElement('div');
      domainEl.className = 'flex items-center justify-between p-2 bg-dev-secondary-bg rounded-lg hover:bg-dev-tertiary-bg transition-colors cursor-pointer';
      domainEl.innerHTML = `
        <div class="flex items-center space-x-3">
          <div class="domain-icon">${domainData.domain.charAt(0).toUpperCase()}</div>
          <div>
            <div class="text-sm font-medium text-dev-text-primary">${domainData.domain}</div>
            <div class="text-xs text-dev-text-secondary">#${index + 1} most visited</div>
          </div>
        </div>
        <div class="text-xs font-mono text-dev-text-primary">${this.formatDuration(domainData.time)}</div>
      `;
      
      container.appendChild(domainEl);
    });
  }

  /**
   * Start real-time updates
   */
  startRealTimeUpdates() {
    // Update every 5 seconds
    this.updateInterval = window.setInterval(async () => {
      try {
        const sessionResponse = await this.sendMessageToBackground('GET_CURRENT_SESSION');
        this.updateCurrentSession(sessionResponse);
        
        // Update session info if there's an active session
        if (sessionResponse.session) {
          this.updateSessionInfo(sessionResponse.session);
        }
      } catch (error) {
        console.error('Error in real-time update:', error);
      }
    }, 5000);
  }

  /**
   * Handle messages from background script
   */
  handleBackgroundMessage(message: any) {
    switch (message.type) {
      case 'SESSION_UPDATE':
        this.updateCurrentSession(message.data);
        break;
      case 'STATS_UPDATE':
        this.updateTodayStats(message.data);
        break;
      default:
        break;
    }
  }

  /**
   * Toggle tracking on/off
   */
  async toggleTracking() {
    try {
      const response = await this.sendMessageToBackground('TOGGLE_TRACKING');
      
      // Update UI immediately
      const sessionResponse = await this.sendMessageToBackground('GET_CURRENT_SESSION');
      this.updateCurrentSession(sessionResponse);
      
      this.showNotification(
        response.isTrackingEnabled ? 'Tracking resumed' : 'Tracking paused',
        'success'
      );
    } catch (error) {
      console.error('Error toggling tracking:', error);
      this.showError('Failed to toggle tracking');
    }
  }

  /**
   * Toggle focus mode
   */
  async toggleFocusMode() {
    // This would implement focus mode functionality
    this.showNotification('Focus mode coming soon!', 'info');
  }

  /**
   * Open settings page
   */
  openSettings() {
    chrome.runtime.openOptionsPage();
  }

  /**
   * Open analytics in web platform
   */
  openAnalytics() {
    chrome.tabs.create({
      url: 'http://localhost:5173/analytics' // Web platform URL
    });
  }

  /**
   * Sync data with server
   */
  async syncData() {
    try {
      const syncBtn = document.getElementById('syncBtn');
      const syncIcon = document.getElementById('syncIcon');
      const syncText = document.getElementById('syncText');
      
      // Show loading state
      if (syncIcon) syncIcon.classList.add('animate-spin');
      if (syncText) syncText.textContent = 'Syncing...';
      
      const response = await this.sendMessageToBackground('SYNC_NOW');
      
      if (response.success) {
        this.showNotification('Data synced successfully', 'success');
      } else {
        this.showNotification('Sync failed - check connection', 'error');
      }
    } catch (error) {
      console.error('Error syncing data:', error);
      this.showError('Failed to sync data');
    } finally {
      // Reset button state
      const syncIcon = document.getElementById('syncIcon');
      const syncText = document.getElementById('syncText');
      
      if (syncIcon) syncIcon.classList.remove('animate-spin');
      if (syncText) syncText.textContent = 'Sync Data';
    }
  }

  /**
   * Open sign in page
   */
  openSignIn() {
    chrome.tabs.create({
      url: 'http://localhost:5173/login' // Web platform URL
    });
  }

  /**
   * Check authentication status
   */
  async checkAuthStatus() {
    try {
      const result = await chrome.storage.local.get('auth_token');
      this.isAuthenticated = !!result.auth_token;
    } catch (error) {
      this.isAuthenticated = false;
    }
  }

  /**
   * Update authentication UI
   */
  updateAuthUI() {
    const authSection = document.getElementById('authSection');
    if (authSection) {
      authSection.classList.toggle('hidden', this.isAuthenticated);
    }
  }

  /**
   * Send message to background script
   */
  sendMessageToBackground(type: string, data?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type, data }, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Utility functions
   */
  formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  calculateProductivityScore(category: string, duration: number): number {
    const baseScores: Record<string, number> = {
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

    return baseScores[category] || 50;
  }

  getCategoryDisplayName(category: string): string {
    const names: Record<string, string> = {
      coding: 'Coding & Development',
      productivity: 'Productivity Tools',
      learning: 'Learning & Education',
      documentation: 'Documentation',
      communication: 'Communication',
      social: 'Social Media',
      entertainment: 'Entertainment',
      shopping: 'Shopping',
      news: 'News & Information',
      other: 'Other'
    };

    return names[category] || 'Unknown';
  }

  getScoreClass(score: number): string {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-average';
    return 'score-poor';
  }

  getProgressBarClass(score: number): string {
    if (score >= 80) return 'bg-gradient-to-r from-categories-coding to-dev-accent-primary';
    if (score >= 60) return 'bg-gradient-to-r from-categories-productivity to-dev-accent-primary';
    if (score >= 40) return 'bg-gradient-to-r from-dev-accent-warning to-dev-accent-primary';
    return 'bg-gradient-to-r from-categories-social to-dev-accent-danger';
  }

  showLoading(show: boolean) {
    const loadingState = document.getElementById('loadingState');
    if (loadingState) {
      loadingState.classList.toggle('hidden', !show);
    }
  }

  showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type === 'success' ? 'border-dev-accent-success' : type === 'error' ? 'border-dev-accent-danger' : 'border-dev-accent-primary'}`;
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <div class="w-2 h-2 rounded-full ${type === 'success' ? 'bg-dev-accent-success' : type === 'error' ? 'bg-dev-accent-danger' : 'bg-dev-accent-primary'}"></div>
        <span class="text-xs text-dev-text-primary">${message}</span>
      </div>
    `;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  showError(message: string) {
    this.showNotification(message, 'error');
  }

  /**
   * Cleanup when popup closes
   */
  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}

// Initialize popup when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new PopupController();
  });
} else {
  new PopupController();
}

export {}; 
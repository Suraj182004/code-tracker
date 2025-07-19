import { WebsiteTracker } from './websiteTracker';
import { StorageManager } from '../utils/storage';
import { CategoryManager } from '../utils/categories';
import { ApiClient } from '../utils/api';
import { TimeTracker } from './timeTracker';

// Initialize tracking components
const websiteTracker = new WebsiteTracker();
const storageManager = new StorageManager();
const categoryManager = new CategoryManager();
const apiClient = new ApiClient();
const timeTracker = new TimeTracker();

// Current tracking state
let currentSession: {
  domain: string;
  startTime: number;
  lastActive: number;
  category: string;
  tabId: number;
} | null = null;

let isIdle = false;
let isTrackingEnabled = true;

/**
 * Initialize the extension
 */
async function initialize() {
  console.log('🚀 Coding Habit Tracker Extension initialized');
  
  // Load settings and state
  const settings = await storageManager.getSettings();
  isTrackingEnabled = settings.trackingEnabled ?? true;
  
  // Set up alarm for periodic sync
  chrome.alarms.create('syncData', { periodInMinutes: 5 });
  
  // Check if user is authenticated
  const authToken = await storageManager.getAuthToken();
  if (!authToken) {
    console.log('📝 User not authenticated, tracking locally only');
  }
}

/**
 * Handle tab activation (switching between tabs)
 */
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (!isTrackingEnabled) return;
  
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    await handleTabChange(tab);
  } catch (error) {
    console.error('Error handling tab activation:', error);
  }
});

/**
 * Handle tab updates (URL changes, page loads)
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!isTrackingEnabled) return;
  
  // Only track when URL changes or page completes loading
  if (changeInfo.url || changeInfo.status === 'complete') {
    try {
      // Check if this is the active tab
      const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTabs[0]?.id === tabId) {
        await handleTabChange(tab);
      }
    } catch (error) {
      console.error('Error handling tab update:', error);
    }
  }
});

/**
 * Handle tab removal (closing tabs)
 */
chrome.tabs.onRemoved.addListener(async (tabId) => {
  if (currentSession && currentSession.tabId === tabId) {
    await endCurrentSession();
  }
});

/**
 * Handle window focus changes
 */
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (!isTrackingEnabled) return;
  
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Browser lost focus - pause tracking
    await pauseTracking();
  } else {
    // Browser gained focus - resume tracking
    await resumeTracking();
  }
});

/**
 * Handle idle state changes
 */
chrome.idle.onStateChanged.addListener(async (newState) => {
  console.log('💤 Idle state changed:', newState);
  
  if (newState === 'idle' || newState === 'locked') {
    isIdle = true;
    await pauseTracking();
  } else if (newState === 'active') {
    isIdle = false;
    await resumeTracking();
  }
});

/**
 * Handle alarms (periodic tasks)
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'syncData') {
    await syncDataToServer();
  }
});

/**
 * Handle tab changes
 */
async function handleTabChange(tab: chrome.tabs.Tab) {
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    return;
  }
  
  // End current session if exists
  if (currentSession) {
    await endCurrentSession();
  }
  
  // Start new session
  await startNewSession(tab);
}

/**
 * Start a new tracking session
 */
async function startNewSession(tab: chrome.tabs.Tab) {
  if (!tab.url || !tab.id) return;
  
  const domain = websiteTracker.extractDomain(tab.url);
  const category = await categoryManager.getCategoryForDomain(domain);
  
  currentSession = {
    domain,
    startTime: Date.now(),
    lastActive: Date.now(),
    category,
    tabId: tab.id
  };
  
  console.log('🌐 Started tracking:', domain, `(${category})`);
  
  // Update badge with domain
  await updateBadge(domain);
  
  // Track in time tracker
  timeTracker.startSession(domain, category);
}

/**
 * End current tracking session
 */
async function endCurrentSession() {
  if (!currentSession) return;
  
  const duration = Date.now() - currentSession.startTime;
  const idleTime = isIdle ? Date.now() - currentSession.lastActive : 0;
  
  // Only save sessions longer than 5 seconds
  if (duration > 5000) {
    const sessionData = {
      domain: currentSession.domain,
      category: currentSession.category,
      startTime: currentSession.startTime,
      endTime: Date.now(),
      duration,
      idleTime,
      productivityScore: await calculateProductivityScore(currentSession.category, duration, idleTime)
    };
    
    // Save to local storage
    await storageManager.saveSession(sessionData);
    
    console.log('💾 Saved session:', sessionData.domain, `${Math.round(duration / 1000)}s`);
  }
  
  // End session in time tracker
  timeTracker.endSession();
  
  currentSession = null;
  await updateBadge();
}

/**
 * Pause tracking (when browser loses focus or user goes idle)
 */
async function pauseTracking() {
  if (currentSession) {
    currentSession.lastActive = Date.now();
  }
  await updateBadge('⏸️');
}

/**
 * Resume tracking (when browser gains focus or user becomes active)
 */
async function resumeTracking() {
  if (currentSession) {
    currentSession.lastActive = Date.now();
    await updateBadge(currentSession.domain);
  }
  
  // Get current active tab and continue tracking
  try {
    const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTabs[0]) {
      await handleTabChange(activeTabs[0]);
    }
  } catch (error) {
    console.error('Error resuming tracking:', error);
  }
}

/**
 * Update extension badge
 */
async function updateBadge(text?: string) {
  if (text) {
    await chrome.action.setBadgeText({ text: text === '⏸️' ? '⏸️' : '●' });
    await chrome.action.setBadgeBackgroundColor({ color: '#00d4ff' });
  } else {
    await chrome.action.setBadgeText({ text: '' });
  }
}

/**
 * Calculate productivity score based on category and usage patterns
 */
async function calculateProductivityScore(category: string, duration: number, idleTime: number): Promise<number> {
  const activeTime = duration - idleTime;
  const activeRatio = activeTime / duration;
  
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
  
  const baseScore = categoryScores[category] || 50;
  
  // Adjust based on active time ratio
  return Math.round(baseScore * activeRatio);
}

/**
 * Sync local data to server
 */
async function syncDataToServer() {
  try {
    const authToken = await storageManager.getAuthToken();
    if (!authToken) return;
    
    const pendingSessions = await storageManager.getPendingSessions();
    if (pendingSessions.length === 0) return;
    
    console.log('🔄 Syncing', pendingSessions.length, 'sessions to server');
    
    const success = await apiClient.uploadSessions(pendingSessions, authToken);
    if (success) {
      await storageManager.clearPendingSessions();
      console.log('✅ Successfully synced data to server');
    }
  } catch (error) {
    console.error('❌ Failed to sync data:', error);
  }
}

/**
 * Handle messages from popup/content scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_CURRENT_SESSION':
      sendResponse({
        session: currentSession,
        isTrackingEnabled,
        isIdle
      });
      break;
      
    case 'TOGGLE_TRACKING':
      isTrackingEnabled = !isTrackingEnabled;
      storageManager.setSetting('trackingEnabled', isTrackingEnabled);
      
      if (!isTrackingEnabled && currentSession) {
        endCurrentSession();
      }
      
      sendResponse({ isTrackingEnabled });
      break;
      
    case 'GET_TODAY_STATS':
      (async () => {
        const stats = await storageManager.getTodayStats();
        sendResponse(stats);
      })();
      return true; // Async response
      
    case 'SYNC_NOW':
      syncDataToServer().then(() => {
        sendResponse({ success: true });
      }).catch(() => {
        sendResponse({ success: false });
      });
      return true; // Async response
      
    default:
      sendResponse({ error: 'Unknown message type' });
  }
});

// Initialize when extension starts
initialize();

// Set idle detection threshold to 60 seconds
chrome.idle.setDetectionInterval(60);

export {}; 
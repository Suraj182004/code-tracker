/**
 * Content Script - Runs on every web page to detect user activity
 */

let lastActivityTime = Date.now();
let activityCheckInterval: number | null = null;
let isPageVisible = true;

/**
 * Initialize content script
 */
function initialize() {
  console.log('🌐 Content script loaded on:', window.location.hostname);
  
  // Set up activity detection
  setupActivityDetection();
  
  // Set up page visibility detection
  setupVisibilityDetection();
  
  // Start activity monitoring
  startActivityMonitoring();
  
  // Send initial page load event
  sendActivityUpdate('page_load');
}

/**
 * Set up activity detection listeners
 */
function setupActivityDetection() {
  const activityEvents = [
    'mousedown',
    'mousemove', 
    'keydown',
    'scroll',
    'touchstart',
    'click',
    'focus'
  ];

  // Throttle activity updates to avoid spam
  let activityTimeout: number | null = null;
  
  const handleActivity = () => {
    lastActivityTime = Date.now();
    
    // Clear existing timeout
    if (activityTimeout) {
      clearTimeout(activityTimeout);
    }
    
    // Throttle updates to every 5 seconds
    activityTimeout = window.setTimeout(() => {
      if (isPageVisible) {
        sendActivityUpdate('user_activity');
      }
    }, 5000);
  };

  // Add event listeners for user activity
  activityEvents.forEach(event => {
    document.addEventListener(event, handleActivity, { passive: true });
  });

  // Special handling for focus events
  window.addEventListener('focus', () => {
    lastActivityTime = Date.now();
    isPageVisible = true;
    sendActivityUpdate('page_focus');
  });

  window.addEventListener('blur', () => {
    sendActivityUpdate('page_blur');
  });
}

/**
 * Set up page visibility detection
 */
function setupVisibilityDetection() {
  document.addEventListener('visibilitychange', () => {
    isPageVisible = !document.hidden;
    
    if (isPageVisible) {
      lastActivityTime = Date.now();
      sendActivityUpdate('page_visible');
    } else {
      sendActivityUpdate('page_hidden');
    }
  });
}

/**
 * Start monitoring activity intervals
 */
function startActivityMonitoring() {
  // Check for activity every 30 seconds
  activityCheckInterval = window.setInterval(() => {
    const timeSinceLastActivity = Date.now() - lastActivityTime;
    
    // If no activity for more than 60 seconds, consider idle
    if (timeSinceLastActivity > 60000) {
      sendActivityUpdate('idle_detected');
    }
  }, 30000);
}

/**
 * Send activity update to background script
 */
function sendActivityUpdate(type: string) {
  chrome.runtime.sendMessage({
    type: 'CONTENT_ACTIVITY',
    data: {
      activityType: type,
      timestamp: Date.now(),
      url: window.location.href,
      title: document.title,
      domain: window.location.hostname,
      isVisible: isPageVisible,
      lastActivity: lastActivityTime
    }
  }).catch(() => {
    // Background script might not be ready, ignore error
  });
}

/**
 * Detect if page is a single page application (SPA)
 */
function detectSPANavigation() {
  let lastUrl = window.location.href;
  
  // Monitor for URL changes in SPAs
  const observer = new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      sendActivityUpdate('spa_navigation');
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Also monitor pushState/replaceState for React Router etc.
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(...args) {
    originalPushState.apply(history, args);
    setTimeout(() => sendActivityUpdate('spa_navigation'), 100);
  };
  
  history.replaceState = function(...args) {
    originalReplaceState.apply(history, args);
    setTimeout(() => sendActivityUpdate('spa_navigation'), 100);
  };
  
  window.addEventListener('popstate', () => {
    sendActivityUpdate('spa_navigation');
  });
}

/**
 * Detect coding-related activities
 */
function detectCodingActivity() {
  // Check if this looks like a coding environment
  const codingIndicators = [
    '.monaco-editor', // VS Code Online
    '.CodeMirror', // CodeMirror editor
    '.ace_editor', // Ace editor
    'textarea[class*="code"]',
    'div[class*="editor"]',
    'pre[class*="highlight"]'
  ];
  
  const hasCodingElements = codingIndicators.some(selector => 
    document.querySelector(selector)
  );
  
  if (hasCodingElements) {
    sendActivityUpdate('coding_detected');
    
    // Monitor code editor activity
    const codeEditors = document.querySelectorAll(codingIndicators.join(','));
    codeEditors.forEach(editor => {
      editor.addEventListener('input', () => {
        sendActivityUpdate('code_edit');
      }, { passive: true });
    });
  }
}

/**
 * Track scroll behavior for engagement
 */
function trackScrollBehavior() {
  let scrollTimeout: number | null = null;
  let totalScrollDistance = 0;
  let lastScrollY = window.scrollY;
  
  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    totalScrollDistance += Math.abs(currentScrollY - lastScrollY);
    lastScrollY = currentScrollY;
    
    // Clear existing timeout
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    
    // Send scroll update after user stops scrolling
    scrollTimeout = window.setTimeout(() => {
      sendActivityUpdate('scroll_engagement');
    }, 1000);
  }, { passive: true });
}

/**
 * Detect productivity tools usage
 */
function detectProductivityTools() {
  const domain = window.location.hostname;
  
  // Check for specific productivity tool patterns
  const productivityPatterns = {
    'docs.google.com': 'google_docs',
    'sheets.google.com': 'google_sheets',
    'slides.google.com': 'google_slides',
    'notion.so': 'notion',
    'airtable.com': 'airtable',
    'trello.com': 'trello',
    'asana.com': 'asana',
    'slack.com': 'slack',
    'discord.com': 'discord'
  };
  
  const toolType = productivityPatterns[domain];
  if (toolType) {
    sendActivityUpdate(`productivity_tool_${toolType}`);
  }
  
  // Detect document editing
  const editableElements = document.querySelectorAll(
    'textarea, [contenteditable="true"], .ql-editor, .notion-page-content'
  );
  
  editableElements.forEach(element => {
    element.addEventListener('input', () => {
      sendActivityUpdate('document_edit');
    }, { passive: true });
  });
}

/**
 * Handle messages from background script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_PAGE_INFO':
      sendResponse({
        url: window.location.href,
        title: document.title,
        domain: window.location.hostname,
        isVisible: isPageVisible,
        lastActivity: lastActivityTime
      });
      break;
      
    case 'INJECT_TRACKER':
      // Inject additional tracking if needed
      sendResponse({ success: true });
      break;
      
    default:
      sendResponse({ error: 'Unknown message type' });
  }
});

/**
 * Clean up when page unloads
 */
window.addEventListener('beforeunload', () => {
  sendActivityUpdate('page_unload');
  
  if (activityCheckInterval) {
    clearInterval(activityCheckInterval);
  }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Set up additional detections after page loads
window.addEventListener('load', () => {
  detectSPANavigation();
  detectCodingActivity();
  trackScrollBehavior();
  detectProductivityTools();
});

export {}; 
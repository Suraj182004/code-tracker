import './options.css';

/**
 * Options page controller
 */
class OptionsController {
  constructor() {
    this.initialize();
  }

  async initialize() {
    await this.loadSettings();
    this.setupEventListeners();
  }

  async loadSettings() {
    const result = await chrome.storage.local.get('settings');
    const settings = result.settings || {};

    // Update form fields
    (document.getElementById('trackingEnabled') as HTMLInputElement).checked = settings.trackingEnabled ?? true;
    (document.getElementById('idleThreshold') as HTMLInputElement).value = settings.idleThreshold ?? 60;
    (document.getElementById('syncInterval') as HTMLInputElement).value = settings.syncInterval ?? 5;
    (document.getElementById('showNotifications') as HTMLInputElement).checked = settings.showNotifications ?? true;
    (document.getElementById('productivityGoal') as HTMLInputElement).value = settings.productivityGoal ?? 480;
  }

  setupEventListeners() {
    document.getElementById('saveSettings')?.addEventListener('click', () => this.saveSettings());
  }

  async saveSettings() {
    const settings = {
      trackingEnabled: (document.getElementById('trackingEnabled') as HTMLInputElement).checked,
      idleThreshold: parseInt((document.getElementById('idleThreshold') as HTMLInputElement).value),
      syncInterval: parseInt((document.getElementById('syncInterval') as HTMLInputElement).value),
      showNotifications: (document.getElementById('showNotifications') as HTMLInputElement).checked,
      productivityGoal: parseInt((document.getElementById('productivityGoal') as HTMLInputElement).value),
    };

    await chrome.storage.local.set({ settings });
    
    // Show success message
    this.showNotification('Settings saved successfully!');
  }

  showNotification(message: string) {
    // Simple notification implementation
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = 'fixed top-4 right-4 bg-dev-accent-success text-white px-4 py-2 rounded-lg';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new OptionsController();
  });
} else {
  new OptionsController();
}

export {}; 
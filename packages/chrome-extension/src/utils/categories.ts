/**
 * CategoryManager - Handles website categorization
 */
export class CategoryManager {
  private static readonly DEFAULT_CATEGORIES = {
    // Coding & Development
    'github.com': 'coding',
    'gitlab.com': 'coding',
    'bitbucket.org': 'coding',
    'codepen.io': 'coding',
    'codesandbox.io': 'coding',
    'replit.com': 'coding',
    'stackoverflow.com': 'coding',
    'stackexchange.com': 'coding',
    'developer.mozilla.org': 'coding',
    'w3schools.com': 'coding',
    'freecodecamp.org': 'coding',
    'leetcode.com': 'coding',
    'hackerrank.com': 'coding',
    'codewars.com': 'coding',
    'localhost': 'coding',
    '127.0.0.1': 'coding',

    // Documentation & Learning
    'docs.microsoft.com': 'documentation',
    'docs.google.com': 'documentation',
    'readthedocs.io': 'documentation',
    'confluence.atlassian.com': 'documentation',
    'notion.so': 'documentation',
    'gitbook.io': 'documentation',
    'medium.com': 'learning',
    'dev.to': 'learning',
    'hashnode.com': 'learning',
    'coursera.org': 'learning',
    'udemy.com': 'learning',
    'pluralsight.com': 'learning',
    'lynda.com': 'learning',
    'edx.org': 'learning',
    'khanacademy.org': 'learning',
    'youtube.com': 'learning', // Could be entertainment too, context matters

    // Productivity Tools
    'gmail.com': 'productivity',
    'outlook.com': 'productivity',
    'calendar.google.com': 'productivity',
    'drive.google.com': 'productivity',
    'dropbox.com': 'productivity',
    'onedrive.live.com': 'productivity',
    'trello.com': 'productivity',
    'asana.com': 'productivity',
    'monday.com': 'productivity',
    'slack.com': 'communication',
    'discord.com': 'communication',
    'teams.microsoft.com': 'communication',
    'zoom.us': 'communication',
    'meet.google.com': 'communication',

    // Social Media
    'facebook.com': 'social',
    'instagram.com': 'social',
    'twitter.com': 'social',
    'x.com': 'social',
    'linkedin.com': 'social',
    'reddit.com': 'social',
    'tiktok.com': 'social',
    'snapchat.com': 'social',
    'pinterest.com': 'social',
    'whatsapp.com': 'social',
    'telegram.org': 'social',

    // Entertainment
    'netflix.com': 'entertainment',
    'hulu.com': 'entertainment',
    'disneyplus.com': 'entertainment',
    'amazon.com': 'shopping', // Could be entertainment for Prime Video
    'spotify.com': 'entertainment',
    'apple.com': 'entertainment', // Apple Music/TV
    'twitch.tv': 'entertainment',
    'gaming.youtube.com': 'entertainment',
    'steam.com': 'entertainment',
    'epicgames.com': 'entertainment',

    // Shopping
    'amazon.com': 'shopping',
    'ebay.com': 'shopping',
    'etsy.com': 'shopping',
    'shopify.com': 'shopping',
    'walmart.com': 'shopping',
    'target.com': 'shopping',
    'bestbuy.com': 'shopping',
    'aliexpress.com': 'shopping',

    // News & Information
    'news.google.com': 'news',
    'bbc.com': 'news',
    'cnn.com': 'news',
    'reuters.com': 'news',
    'nytimes.com': 'news',
    'washingtonpost.com': 'news',
    'techcrunch.com': 'news',
    'ycombinator.com': 'news',
    'hackernews.org': 'news',
    'wikipedia.org': 'learning',

    // Cloud Services & Tools
    'aws.amazon.com': 'coding',
    'console.cloud.google.com': 'coding',
    'portal.azure.com': 'coding',
    'heroku.com': 'coding',
    'vercel.com': 'coding',
    'netlify.com': 'coding',
    'digitalocean.com': 'coding',
    'firebase.google.com': 'coding',
    'supabase.com': 'coding',

    // Design Tools
    'figma.com': 'productivity',
    'sketch.com': 'productivity',
    'adobe.com': 'productivity',
    'canva.com': 'productivity',
    'dribbble.com': 'productivity',
    'behance.net': 'productivity',
  } as const;

  private static readonly CATEGORY_PATTERNS = {
    coding: [
      /\.(dev|local)$/,
      /^localhost/,
      /^127\.0\.0\.1/,
      /^192\.168\./,
      /git(hub|lab)/,
      /stack(overflow|exchange)/,
      /code(pen|sandbox|wars)/,
      /repl\.it/,
      /jsfiddle/,
      /codesandbox/,
    ],
    documentation: [
      /docs\./,
      /documentation/,
      /api\./,
      /reference/,
      /manual/,
      /guide/,
      /wiki/,
    ],
    social: [
      /facebook/,
      /instagram/,
      /twitter/,
      /linkedin/,
      /reddit/,
      /tiktok/,
      /snapchat/,
      /whatsapp/,
      /telegram/,
    ],
    entertainment: [
      /netflix/,
      /hulu/,
      /disney/,
      /spotify/,
      /twitch/,
      /gaming/,
      /steam/,
      /youtube.*gaming/,
    ],
    shopping: [
      /amazon/,
      /ebay/,
      /shop/,
      /store/,
      /buy/,
      /cart/,
      /checkout/,
    ],
    news: [
      /news/,
      /bbc/,
      /cnn/,
      /nytimes/,
      /reuters/,
      /techcrunch/,
      /hackernews/,
    ],
  };

  private customCategories: Record<string, string> = {};

  constructor() {
    this.loadCustomCategories();
  }

  /**
   * Get category for a domain
   */
  async getCategoryForDomain(domain: string): Promise<string> {
    // Check custom categories first
    if (this.customCategories[domain]) {
      return this.customCategories[domain];
    }

    // Check direct domain matches
    if (CategoryManager.DEFAULT_CATEGORIES[domain as keyof typeof CategoryManager.DEFAULT_CATEGORIES]) {
      return CategoryManager.DEFAULT_CATEGORIES[domain as keyof typeof CategoryManager.DEFAULT_CATEGORIES];
    }

    // Check patterns
    for (const [category, patterns] of Object.entries(CategoryManager.CATEGORY_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(domain)) {
          return category;
        }
      }
    }

    // Check subdomain patterns
    const mainDomain = this.getMainDomain(domain);
    if (mainDomain !== domain) {
      return this.getCategoryForDomain(mainDomain);
    }

    // Default to 'other' if no match found
    return 'other';
  }

  /**
   * Set custom category for a domain
   */
  async setCustomCategory(domain: string, category: string): Promise<void> {
    this.customCategories[domain] = category;
    await this.saveCustomCategories();
  }

  /**
   * Remove custom category for a domain
   */
  async removeCustomCategory(domain: string): Promise<void> {
    delete this.customCategories[domain];
    await this.saveCustomCategories();
  }

  /**
   * Get all available categories
   */
  getAvailableCategories(): CategoryInfo[] {
    return [
      { id: 'coding', name: 'Coding & Development', color: '#10b981', icon: '💻' },
      { id: 'productivity', name: 'Productivity Tools', color: '#00d4ff', icon: '⚡' },
      { id: 'learning', name: 'Learning & Education', color: '#7c3aed', icon: '📚' },
      { id: 'documentation', name: 'Documentation', color: '#6366f1', icon: '📖' },
      { id: 'communication', name: 'Communication', color: '#3b82f6', icon: '💬' },
      { id: 'social', name: 'Social Media', color: '#ef4444', icon: '👥' },
      { id: 'entertainment', name: 'Entertainment', color: '#f59e0b', icon: '🎮' },
      { id: 'shopping', name: 'Shopping', color: '#8b5cf6', icon: '🛒' },
      { id: 'news', name: 'News & Information', color: '#06b6d4', icon: '📰' },
      { id: 'other', name: 'Other', color: '#71717a', icon: '🌐' },
    ];
  }

  /**
   * Get category info by ID
   */
  getCategoryInfo(categoryId: string): CategoryInfo {
    const categories = this.getAvailableCategories();
    return categories.find(cat => cat.id === categoryId) || categories.find(cat => cat.id === 'other')!;
  }

  /**
   * Bulk categorize domains using AI/ML (placeholder for future implementation)
   */
  async bulkCategorizeDomains(domains: string[]): Promise<Record<string, string>> {
    const results: Record<string, string> = {};
    
    for (const domain of domains) {
      results[domain] = await this.getCategoryForDomain(domain);
    }
    
    return results;
  }

  /**
   * Get productivity score for category
   */
  getCategoryProductivityScore(category: string): number {
    const scores: Record<string, number> = {
      coding: 100,
      productivity: 80,
      learning: 90,
      documentation: 85,
      communication: 60,
      social: 20,
      entertainment: 10,
      shopping: 30,
      news: 40,
      other: 50,
    };
    
    return scores[category] || 50;
  }

  /**
   * Check if category is considered productive
   */
  isProductiveCategory(category: string): boolean {
    const productiveCategories = ['coding', 'productivity', 'learning', 'documentation'];
    return productiveCategories.includes(category);
  }

  /**
   * Load custom categories from storage
   */
  private async loadCustomCategories(): Promise<void> {
    try {
      const result = await chrome.storage.local.get('custom_categories');
      this.customCategories = result.custom_categories || {};
    } catch (error) {
      console.error('Error loading custom categories:', error);
      this.customCategories = {};
    }
  }

  /**
   * Save custom categories to storage
   */
  private async saveCustomCategories(): Promise<void> {
    try {
      await chrome.storage.local.set({
        custom_categories: this.customCategories
      });
    } catch (error) {
      console.error('Error saving custom categories:', error);
    }
  }

  /**
   * Extract main domain from subdomain
   */
  private getMainDomain(domain: string): string {
    const parts = domain.split('.');
    if (parts.length >= 2) {
      return parts.slice(-2).join('.');
    }
    return domain;
  }

  /**
   * Learn from user corrections (for future ML implementation)
   */
  async learnFromCorrection(domain: string, oldCategory: string, newCategory: string): Promise<void> {
    // For now, just save as custom category
    await this.setCustomCategory(domain, newCategory);
    
    // Future: Send to ML service for model improvement
    console.log(`📚 Learning: ${domain} changed from ${oldCategory} to ${newCategory}`);
  }
}

export interface CategoryInfo {
  id: string;
  name: string;
  color: string;
  icon: string;
} 
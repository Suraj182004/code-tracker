/**
 * WebsiteTracker - Handles website URL processing and domain extraction
 */
export class WebsiteTracker {
  /**
   * Extract domain from URL
   */
  extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch (error) {
      console.error('Error extracting domain from URL:', url, error);
      return 'unknown';
    }
  }

  /**
   * Extract the main domain without subdomains
   */
  getMainDomain(domain: string): string {
    const parts = domain.split('.');
    if (parts.length >= 2) {
      return parts.slice(-2).join('.');
    }
    return domain;
  }

  /**
   * Check if URL should be tracked
   */
  shouldTrackUrl(url: string): boolean {
    if (!url) return false;
    
    // Skip chrome internal pages
    if (url.startsWith('chrome://') || 
        url.startsWith('chrome-extension://') ||
        url.startsWith('moz-extension://') ||
        url.startsWith('about:')) {
      return false;
    }

    // Skip local files
    if (url.startsWith('file://')) {
      return false;
    }

    // Only track http/https
    return url.startsWith('http://') || url.startsWith('https://');
  }

  /**
   * Normalize URL for consistent tracking
   */
  normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove common tracking parameters
      const trackingParams = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'fbclid', 'gclid', 'msclkid', '_ga', 'mc_eid'
      ];
      
      trackingParams.forEach(param => {
        urlObj.searchParams.delete(param);
      });
      
      return urlObj.toString();
    } catch (error) {
      return url;
    }
  }

  /**
   * Get page title from tab
   */
  getPageTitle(tab: chrome.tabs.Tab): string {
    return tab.title || 'Untitled';
  }

  /**
   * Check if domain is a development/localhost domain
   */
  isDevelopmentDomain(domain: string): boolean {
    return domain === 'localhost' || 
           domain.startsWith('127.0.0.1') || 
           domain.startsWith('192.168.') ||
           domain.endsWith('.local') ||
           domain.endsWith('.dev');
  }

  /**
   * Extract subdomain from domain
   */
  getSubdomain(domain: string): string | null {
    const parts = domain.split('.');
    if (parts.length > 2) {
      return parts[0];
    }
    return null;
  }
} 
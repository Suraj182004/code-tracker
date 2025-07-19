import { WebsiteSession } from './storage';

/**
 * ApiClient - Handles communication with the backend API
 */
export class ApiClient {
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api.codinghabittracker.com' // Replace with actual production URL
      : 'http://localhost:3001';
    this.timeout = 10000; // 10 seconds
  }

  /**
   * Upload website sessions to the server
   */
  async uploadSessions(sessions: WebsiteSession[], authToken: string): Promise<boolean> {
    try {
      const response = await this.makeRequest('/api/sessions/website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          sessions: sessions.map(session => ({
            domain: session.domain,
            category: session.category,
            startTime: new Date(session.startTime).toISOString(),
            endTime: new Date(session.endTime).toISOString(),
            duration: session.duration,
            idleTime: session.idleTime,
            productivityScore: session.productivityScore,
            url: session.url,
            title: session.title,
            source: 'chrome-extension',
            version: '1.0.0'
          }))
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error uploading sessions:', error);
      return false;
    }
  }

  /**
   * Get user profile from server
   */
  async getUserProfile(authToken: string): Promise<UserProfile | null> {
    try {
      const response = await this.makeRequest('/api/user/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        }
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Authenticate user with email/password
   */
  async authenticateUser(email: string, password: string): Promise<AuthResult> {
    try {
      const response = await this.makeRequest('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          token: data.token,
          user: data.user
        };
      } else {
        return {
          success: false,
          error: data.message || 'Authentication failed'
        };
      }
    } catch (error) {
      console.error('Error authenticating user:', error);
      return {
        success: false,
        error: 'Network error during authentication'
      };
    }
  }

  /**
   * Register new user
   */
  async registerUser(email: string, password: string, name: string): Promise<AuthResult> {
    try {
      const response = await this.makeRequest('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name })
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          token: data.token,
          user: data.user
        };
      } else {
        return {
          success: false,
          error: data.message || 'Registration failed'
        };
      }
    } catch (error) {
      console.error('Error registering user:', error);
      return {
        success: false,
        error: 'Network error during registration'
      };
    }
  }

  /**
   * Verify auth token
   */
  async verifyToken(authToken: string): Promise<boolean> {
    try {
      const response = await this.makeRequest('/api/auth/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error verifying token:', error);
      return false;
    }
  }

  /**
   * Get leaderboard data
   */
  async getLeaderboard(authToken: string, timeframe: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<LeaderboardEntry[]> {
    try {
      const response = await this.makeRequest(`/api/leaderboard?timeframe=${timeframe}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.leaderboard || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }

  /**
   * Get user analytics data
   */
  async getAnalytics(
    authToken: string, 
    startDate: string, 
    endDate: string
  ): Promise<AnalyticsData | null> {
    try {
      const response = await this.makeRequest(
        `/api/analytics?startDate=${startDate}&endDate=${endDate}`, 
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
          }
        }
      );

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error getting analytics:', error);
      return null;
    }
  }

  /**
   * Send feedback or report
   */
  async sendFeedback(
    authToken: string, 
    type: 'feedback' | 'bug' | 'feature', 
    message: string
  ): Promise<boolean> {
    try {
      const response = await this.makeRequest('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ type, message })
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending feedback:', error);
      return false;
    }
  }

  /**
   * Check server health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/health', {
        method: 'GET',
      });

      return response.ok;
    } catch (error) {
      console.error('Error checking server health:', error);
      return false;
    }
  }

  /**
   * Make HTTP request with timeout and error handling
   */
  private async makeRequest(endpoint: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }

  /**
   * Check if the server is reachable
   */
  async isServerReachable(): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get API status and version info
   */
  async getApiInfo(): Promise<ApiInfo | null> {
    try {
      const response = await this.makeRequest('/api/info', {
        method: 'GET',
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error getting API info:', error);
      return null;
    }
  }
}

// Type definitions
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  timezone: string;
  createdAt: string;
  settings: {
    notifications: boolean;
    privacy: 'public' | 'private';
    theme: 'light' | 'dark';
  };
}

export interface AuthResult {
  success: boolean;
  token?: string;
  user?: UserProfile;
  error?: string;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  totalTime: number;
  productivityScore: number;
  rank: number;
  isCurrentUser?: boolean;
}

export interface AnalyticsData {
  totalTime: number;
  productiveTime: number;
  topDomains: Array<{ domain: string; time: number; category: string }>;
  categoryBreakdown: Record<string, number>;
  dailyActivity: Array<{ date: string; time: number; productivityScore: number }>;
  productivity: {
    score: number;
    trend: 'up' | 'down' | 'stable';
    change: number;
  };
  goals: {
    dailyTarget: number;
    achieved: number;
    streak: number;
  };
}

export interface ApiInfo {
  version: string;
  environment: string;
  uptime: number;
  features: string[];
} 